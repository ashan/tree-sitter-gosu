package nz.co.acc.plm.integration.files.outbound.letter

uses gw.pl.persistence.core.Bundle
uses nz.co.acc.common.integration.files.outbound.FullCapturableData

uses nz.co.acc.plm.integration.webservice.address.CorrespondenceDetailsUtil
uses typekey.Contact
uses gw.surepath.suite.integration.logging.StructuredLogger

/**
 * Action class which creates an Outbound Record for a CPX Mailhouse CPX letter
 * and store it in the outbound records staging table using the outbound framework .
 * This is a base action class for all the CPX letters, unless extended for specific letter cases.
 * <p>
 */
class CpxLetterAction extends FullCapturableData {
  var _correspondenceDetailsUtil = new CorrespondenceDetailsUtil()
  static private var _log = StructuredLogger.INTEGRATION.withClass(CpxLetterAction)

  construct(type : OutBoundRecordType_ACC, bundle : Bundle) {
    super(type, bundle)
  }

  override function captureFull(entity : KeyableBean) {
    var policyPeriod = entity as PolicyPeriod
    // JUNO-643 - Do not create an outbound record for transactions in a draft status
    if (policyPeriod.Status == PolicyPeriodStatus.TC_DRAFT) {
      return
    }

    var cpxOfferLetterData = new CpxOfferLetterData()
    capturePolicyOfferDetails(cpxOfferLetterData, policyPeriod)

    var account = policyPeriod.Policy.Account
    captureAccountDetails(cpxOfferLetterData, account)

    var data = cpxOfferLetterData.toXML(nz.co.acc.plm.integration.files.outbound.letter.model.cpxofferletterdatamodel.CpxOfferLetterData)

    // single() is used because INDCPXCovs array is expected to contain always one item
    var amount = policyPeriod.INDCPXLine.INDCPXCovs.single().CPXInfoCovs.first().AgreedLevelOfCover

    var record : OutBoundRecord_ACC
    if (policyPeriod.PolicyNumber == null) {
      record = newRecord(account.ACCID_ACC, policyPeriod.Class.Name, policyPeriod.ID.Value, data, amount)
    } else {
      record = newRecord(account.ACCID_ACC, policyPeriod.Class.Name, policyPeriod.ID.Value, data, amount, policyPeriod.PolicyNumber, AddressPolicyType_ACC.TC_CPCPX.Code)
    }

    setInValidAddressStatus(cpxOfferLetterData, record)
  }

  /**
   * Capture account data for the Cpx Letter
   *
   * @param account
   */
  protected function captureAccountDetails(letterData : CpxOfferLetterData, account : Account) {
    // For CPX, the offer is only for Person, not for Company.
    var primaryContact = account.PrimaryContact_ACC
    var correspondenceDetails = _correspondenceDetailsUtil.getCorrespondenceDetails(
        account,
        Optional.of(AddressPolicyType_ACC.TC_CPCPX))

    letterData.AccAccountNumber = account.ACCID_ACC
    letterData.AccountStatus = account.StatusOfAccount_ACC.DisplayName
    letterData.AccountFullName = account.AccountHolderContact.DisplayName.truncate(50)
    letterData.PrimaryEmail = primaryContact.EmailAddress1
    letterData.Mobile = (primaryContact.Subtype == Contact.TC_PERSON) ? (primaryContact as Person).CellPhoneValue : ""
    letterData.HasValidAddress = correspondenceDetails.HasValidCorrespondenceDetails
    letterData.AddressLine1 = correspondenceDetails.AddressLine1
    letterData.AddressLine2 = correspondenceDetails.AddressLine2
    letterData.AddressLine3 = correspondenceDetails.AddressLine3
    letterData.City = correspondenceDetails.City
    letterData.PostCode = correspondenceDetails.PostalCode
    letterData.Attn = correspondenceDetails.Attention_ACC
    letterData.Country = correspondenceDetails.Country?.DisplayName
    letterData.AddressValidUntil = correspondenceDetails.AddressValidUntil
    // Chris A 02/12/2019 NTK-8575 add Correspondence Preference
    letterData.CorrespondencePreference_ACC = correspondenceDetails.CorrespondencePreference
    // Chris A 29/09/2020 JUNO-6675 add NZBN to letters
    letterData.NZBN = account.NZBN_ACC
  }

  /**
   * Capture policy period data for the Cpx Letter (for new submission and renewal) .
   *
   * @param policyPeriod
   */
  protected function capturePolicyOfferDetails(letterData : CpxOfferLetterData, policyPeriod : PolicyPeriod) {
    // single() is used because BICCodes array is expected to contain always one item
    letterData.CUCode = policyPeriod.INDCPXLine.BICCodes.single().CUCode
    letterData.CUDescription = policyPeriod.INDCPXLine.BICCodes.single().CUDescription

    // single() is used because INDCPXCovs array is expected to contain always one item
    var lastEffectivePeriod = policyPeriod.INDCPXLine.INDCPXCovs.single().CPXInfoCovs.sortBy(\elt -> elt.PeriodStart).last()
    letterData.AgreedLevelOfCover = lastEffectivePeriod.AgreedLevelOfCover
    letterData.CoverTypeStandard = lastEffectivePeriod.CoverTypeStandard

    if (RecordType == OutBoundRecordType_ACC.TC_CPX_VARIATION) {
      letterData.PolicyStartDate = policyPeriod.INDCPXLine.INDCPXCovs*.CPXInfoCovs.orderByDescending(\elt -> elt.PeriodStart).first().PeriodStart
    } else {
      letterData.PolicyStartDate = lastEffectivePeriod.PeriodStart
    }

    letterData.PolicyEndDate = lastEffectivePeriod.PeriodEnd
    letterData.PolicyLine = policyPeriod.INDCPXLine.DisplayName
    letterData.GrossLevy = policyPeriod.TotalCostRPT.Amount

    var policy = policyPeriod.Policy
    letterData.ProductName = policy.Product.Name
  }

  protected function setInValidAddressStatus(letterData : CpxOfferLetterData, record : OutBoundRecord_ACC) {
    if (!letterData.HasValidAddress) {
      record.Status = OutBoundRecordStatus_ACC.TC_INVALID_ADDRESS
    }
  }

}
