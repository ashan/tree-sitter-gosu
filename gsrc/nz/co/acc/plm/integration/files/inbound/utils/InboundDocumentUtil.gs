package nz.co.acc.plm.integration.files.inbound.utils

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.pl.persistence.core.Bundle
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.plm.integration.files.inbound.InboundDocument

uses java.lang.invoke.MethodHandles


/**
 * Created by Nithy on 3/05/2017.
 */
class InboundDocumentUtil {
  private static final var _logger = StructuredLogger.INTEGRATION.withClass(MethodHandles.lookup().lookupClass())

  public static function createDocument(bundle: Bundle, inboundDocument: InboundDocument) {
    var funcName = "createDocument"
    try {
      if (inboundDocument != null) {
        var document = bundle.add(new Document())
        document.setName(inboundDocument.Filename)
        document.setMimeType(com.guidewire.pl.system.dependency.PLDependencies.getMimeTypeManager().getMimeType("." + org.apache.commons.io.FilenameUtils.getExtension(inboundDocument.Filename)))
        document.setDocUID(inboundDocument.SP_GUID)
        document.setTaxInvoiceNumber_ACC(inboundDocument.InvoiceNumber)
        document.setStatus(DocumentStatusType.TC_FINAL)
        document.Account = getAccount(inboundDocument.ACCID)
        document.Policy = getPolicy(inboundDocument.PolicyNumber)
        document.setDMS(true)
        document.setAuthor("System")
        document.setInvoiceDate(inboundDocument.Date)
        document.setType(inboundDocument.DocType)
      }
    } catch (e: Exception) {
      _logger.error_ACC("[InboundDocumentUtil ] Create document error.", e)
      throw e
    }
    return
  }

  private static function getAccount(accountNumber: String): Account {
    if (accountNumber != null) {
      var account = Query.make(Account).compare("ACCID_ACC", Equals, accountNumber).select().first()
      return account
    } else return null
  }

  public static function getPolicy(policyNumber : String) : Policy {
    return getPolicyPeriod(policyNumber)?.Policy
  }

  public static function getPolicyPeriod(policyNumber : String) : PolicyPeriod {
    if (policyNumber != null) {
      // JUNO-2806 This step looks for policy number using the old format: ACCID_ACC + Suffix eg: A1234567S
      var policyPeriod = Query.make(PolicyPeriod).compare(PolicyPeriod#PolicyNumber, Relop.Equals, policyNumber).select().FirstResult
      if (policyPeriod != null) {
        return policyPeriod
      } else {
        // This account doesn't use the old policy number format so search on the ACCPolicyID_ACC instead and return the GW PolicyNumber variation
        // Or it could be that this account is one of the migrated accounts that have individual policies for each year before 2018
        // where the policy numbers have a year suffix up to 2018: D6087390E2001_1 -> D6087390E2018
        // In both these cases, taking the last policy period levy year should cause this document to show up on all years after 2017
        policyPeriod = Query.make(PolicyPeriod)
            .compare(PolicyPeriod#ACCPolicyID_ACC, Relop.Equals, policyNumber)
            .compare(PolicyPeriod#LevyYear_ACC, Relop.GreaterThanOrEquals, 2018)
            .compareIn(PolicyPeriod#Status, {PolicyPeriodStatus.TC_AUDITCOMPLETE, PolicyPeriodStatus.TC_BOUND})
            .select()
            .FirstResult
        return policyPeriod
      }
    } else return null
  }

  public static function deleteDocument(bundle: Bundle, inboundDocument: InboundDocument) {
    final var funcName = "InboundDocumentUtil.deleteDocument"
    try {
      if (inboundDocument != null) {
        final var queryObj = Query.make(entity.Document)
        queryObj.compare(entity.Document#DocUID, Relop.Equals, inboundDocument.SP_GUID)
        var queryAccount = queryObj.join(entity.Document#Account)
        queryAccount.compare(Account#ACCID_ACC, Relop.Equals, inboundDocument.ACCID)
        var document = queryObj.select().AtMostOneRow
        if (document != null) {
          var editableDocument = bundle.add(document)
          editableDocument.remove() // It will automatically call the IDocumentContentSource plugin. See DocumentsHelper.gs for additional information.
        } else {
          _logger.info("Inbound - Could not find document to delete, ACCID=${inboundDocument.ACCID}, DocUID=${inboundDocument.SP_GUID}")
        }
      }
    } catch (e: Exception) {
      _logger.error_ACC("[InboundDocumentUtil ] Delete document error ", e)
      throw e
    }
    return
  }
}
