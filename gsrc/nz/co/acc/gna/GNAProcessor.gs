package nz.co.acc.gna

uses entity.Address
uses entity.Contact
uses gw.api.database.Query
uses gw.api.locale.DisplayKey
uses gw.pl.persistence.core.Bundle
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.plm.integration.files.inbound.utils.ActivityUtil_ACC
uses nz.co.acc.plm.integration.files.inbound.utils.InboundDocumentUtil
uses gw.surepath.suite.integration.logging.StructuredLogger
uses wsi.remote.gw.webservice.bc.bc_acc.invoicepolicyapi.InvoicePolicyAPI

/**
 * Handles GNA updates
 */
class GNAProcessor {
  private static final var _log = StructuredLogger.CONFIG.withClass(GNAProcessor)
  final var _invoicePolicyAPI = new InvoicePolicyAPI()
  final var _addressHistoryUtil = new AddressHistoryUtil()
  final var _primaryContactHistoryUtil = new PrimaryContactHistoryUtil()

  /**
   * @param bundle
   * @param gnaUpdateData
   */
  public function gnaUpdate(bundle : Bundle, gnaInboundData : GNAInboundData_ACC) {
    if (gnaInboundData == null) {
      return
    }

    try {
      if (gnaInboundData.DocumentType == "A") {
        gnaUpdateAccount(bundle, gnaInboundData)

      } else if (gnaInboundData.DocumentType == "P") {
        gnaUpdatePolicy(bundle, gnaInboundData)

      } else if (gnaInboundData.DocumentType == "I") {
        gnaUpdateInvoice(bundle, gnaInboundData)

      }

    } catch (e : Exception) {
      _log.error_ACC("Error occurred when processing GNA update", e)
      throw e
    }
  }

  private function gnaUpdateAccount(bundle : Bundle, gnaInboundData : GNAInboundData_ACC) {
    // Validate DocumentID
    if (gnaInboundData.DocumentID == null) {
      var errorMessage = DisplayKey.get("ext.Integration.GNA.ErrorMessage.IncorrectACCID", gnaInboundData.FileDocumentID)
      throw new RuntimeException(errorMessage)
    }

    // Find account
    var account = Query.make(Account).compare(Account#ACCID_ACC, Equals, gnaInboundData.DocumentID).select().AtMostOneRow
    if (account == null) {
      var errorMessage = DisplayKey.get("ext.Integration.GNA.ErrorMessage.NoMatchACCID", gnaInboundData.FileDocumentID)
      throw new RuntimeException(errorMessage)
    }

    var documentDate = documentDateLogic(gnaInboundData)

    // Find historical address and historical primary contact
    var historicPrimaryContact = _primaryContactHistoryUtil.getLatestPrimaryContactAt(account, documentDate)
    var historicalPrimaryAddress = _addressHistoryUtil.getHistoricalPrimaryAddress(historicPrimaryContact, documentDate)
    if (historicalPrimaryAddress != null) {
      makeAddressGNA(bundle, historicPrimaryContact, account, historicalPrimaryAddress, documentDate)
    }
  }

  private function setPrimaryContactTheAccountHolder(bundle : Bundle, account : Account) : void {
    bundle.add(account)
    account.setPrimaryContact_ACC(account.AccountHolder.AccountContact)
  }


  /**
   * The document date logic structure that can be processed by the documentDateLogic method.
   *
   * @author Ron Webb
   * @since 2019-05-20
   */
  public structure DocumentDateLogicStruct_ACC {
    property get DocumentDate() : Date

    property get DocumentType() : String
  }

  /**
   * Selects which DocumentDate logic to use based only DocumentType
   *
   * @param gnaInboundData An instance of structurally equal to GNADateLogicStruct_ACC
   * @return The output of the selected document date logic used based on DocumentType.
   * @author Ron Webb
   * @since 2019-05-20
   */
  public function documentDateLogic(gnaInboundData : DocumentDateLogicStruct_ACC) : Date {
    var documentDateLogicADayBefore = \-> gnaInboundData.DocumentDate.addDays(-1)
    var documentDateLogicByDocType = {
        "I" -> \-> gnaInboundData.DocumentDate,
        "P" -> documentDateLogicADayBefore,
        "A" -> documentDateLogicADayBefore
    }
    return documentDateLogicByDocType.get(gnaInboundData.DocumentType)()
  }

  private function gnaUpdatePolicy(bundle : Bundle, gnaInboundData : GNAInboundData_ACC) {
    final var fn = "gnaUpdatePolicy"

    // Validate DocumentID
    if (gnaInboundData.DocumentID == null) {
      var errorMessage = DisplayKey.get("ext.Integration.GNA.ErrorMessage.IncorrectPolicy", gnaInboundData.FileDocumentID)
      throw new RuntimeException(errorMessage)
    }

    // Find Policy Period
    // ChrisA 10/07/2020 JUNO-2836 Update GNA processor to use both ACC_PolicyID and PolicyID
    var policyPeriod = InboundDocumentUtil.getPolicyPeriod(gnaInboundData.DocumentID)
    if (policyPeriod == null) {
      var errorMessage = DisplayKey.get("ext.Integration.GNA.ErrorMessage.NoMatchPolicy", gnaInboundData.FileDocumentID)
      throw new RuntimeException(errorMessage)
    }

    var documentDate = documentDateLogic(gnaInboundData)

    var account = policyPeriod.Policy.Account
    // Find historical address and historical primary contact
    var historicPrimaryContact = _primaryContactHistoryUtil.getLatestPrimaryContactAt(account, documentDate)
    var historicalPrimaryAddress = _addressHistoryUtil.getHistoricalPrimaryAddress(historicPrimaryContact, documentDate)
    var productCode = policyPeriod.Policy.ProductCode

    // GNA update
    if (historicalPrimaryAddress != null) {
      _log.info("Setting address GNA for ProductCode=${productCode} at DocumentDate=${documentDate}")
      makeAddressGNA(bundle, historicPrimaryContact, account, historicalPrimaryAddress, documentDate)
    } else {
      _log.info("Address History not found for ProductCode=${productCode} at DocumentDate=${documentDate}")
    }
  }

  private function gnaUpdateInvoice(bundle : Bundle, gnaData : GNAInboundData_ACC) {
    // Validate DocumentID
    if (gnaData.DocumentID == null) {
      var errorMessage = DisplayKey.get("ext.Integration.GNA.ErrorMessage.IncorrectInvoice", gnaData.FileDocumentID)
      throw new Exception(errorMessage)
    }

    // Find Account via BC
    var accountInvoice = _invoicePolicyAPI.getAccountInvoice(gnaData.DocumentID)
    if (accountInvoice == null) {
      throw new RuntimeException("Account Invoice not found for InvoiceID=${gnaData.DocumentID}")
    }
    if (accountInvoice.Account.AccountNumber == null) {
      throw new RuntimeException("Invoice number cannot be found: ${gnaData.DocumentID}")
    }

    // Find Policy for Account
    var policyPeriod = Policy.finder.findPolicyByPolicyNumber(accountInvoice.PolicyNumber)?.LatestPeriod
    if (policyPeriod == null) {
      throw new RuntimeException("Policy number cannot be found: ${accountInvoice.PolicyNumber}")
    }

    // Raise Activity if AEP
    if (accountInvoice.Product == "Accredited Employers Programme") {
      var ticketMessage = DisplayKey.get("ext.Integration.GNA.ErrorMessage.AEPGNA", gnaData.DocumentID)
      ActivityUtil_ACC.createInboundFailureActivity(bundle, policyPeriod.Policy.Account, ticketMessage)
    }

    // Find Account
    var account = Account.finder.findAccountByAccountNumber(accountInvoice.Account.AccountNumber)
    if (account == null) {
      throw new RuntimeException("Account number cannot be found: ${accountInvoice.Account.AccountNumber}")
    }

    var documentDate = documentDateLogic(gnaData)

    // Find historical address and historical primary contact
    var historicPrimaryContact = _primaryContactHistoryUtil.getLatestPrimaryContactAt(account, documentDate)
    var historicalPrimaryAddress = _addressHistoryUtil.getHistoricalPrimaryAddress(historicPrimaryContact, documentDate)
    var productCode = policyPeriod.Policy.ProductCode
    // GNA Update
    if (historicalPrimaryAddress != null) {
      _log.info("Setting address GNA for ProductCode=${productCode} at DocumentDate=${documentDate}")
      if (makeAddressGNA(bundle, historicPrimaryContact, account, historicalPrimaryAddress, documentDate)) {
        _invoicePolicyAPI.setInvoiceGNAFlag(gnaData.DocumentID)
      }
    } else {
      _log.info("Address History not found for ProductCode=${policyPeriod.Policy.ProductCode} at DocumentDate=${documentDate}")
    }

  }

  private function makeAddressGNA(bundle : Bundle, historicPrimaryContact : Contact, account : Account, gnaAddress : Address, gnaUpdateDate : Date) : boolean {
    if (gnaAddress.UpdateTime_ACC == null or !gnaAddress.UpdateTime_ACC.after(gnaUpdateDate)) {
      // if the address has not been updated since the GNAUpdateDate mark it as GNA.
      gnaAddress = bundle.add(gnaAddress)
      gnaAddress.ValidUntil = Date.Yesterday
      if (historicPrimaryContact == account.AccountHolderContact) {
        var newAddress = new GNAReplacementStrategy().findValidAddressForReplacingGNAAddress(account.AccountHolderContact, Optional.ofNullable(gnaAddress))
        if (newAddress.Present && newAddress.get().ID != gnaAddress.ID) {
          replaceGNAAddress(bundle, account.AccountHolderContact, gnaAddress, newAddress.get())
        }
      } else {
        if (historicPrimaryContact == account.PrimaryContact_ACC) {
          if (historicPrimaryContact.CorrespondencePreference_ACC == CorrespondencePreference_ACC.TC_MAIL) {
            setPrimaryContactTheAccountHolder(bundle, account)
          }
        }
      }
      return true
    }
    _log.info("The address has been updated since the GNA update, ignore and continue.")
    return false
  }

  private function replaceGNAAddress(bundle : Bundle, contact : Contact, gnaAddress : Address, newAddress : Address) {
    var editNewAddress = bundle.add(newAddress)
    contact = bundle.add(contact)
    if (contact.PrimaryAddress.ID == gnaAddress.ID) {
      contact.makePrimaryAddress(editNewAddress)
    }
    //Link all correspondence
    if (contact.WPCAddress_ACC == gnaAddress) {
      contact.makeWPCAddress_ACC(newAddress)
    }
    if (contact.CPCPXAddress_ACC == gnaAddress) {
      contact.makeCPCPXAddress_ACC(newAddress)
    }
    if (contact.WPSAddress_ACC == gnaAddress) {
      contact.makeWPSAddress_ACC(newAddress)
    }
  }

}
