package nz.co.acc.integration.mailhouse.upload

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.api.util.DisplayableException
uses gw.plugin.Plugins
uses gw.plugin.document.IDocumentContentSource
uses gw.processes.WorkQueueBase
uses gw.surepath.suite.integration.logging.StructuredLogger_ACC
uses nz.co.acc.common.integration.dms.DocumentStoreException
uses nz.co.acc.integration.mailhouse.MailhouseFileUtil
uses nz.co.acc.plm.integration.files.inbound.utils.InboundDocumentUtil

uses java.io.FileInputStream

class MailhouseDocumentUploadWorkQueue extends WorkQueueBase<MailhouseStaging_ACC, StandardWorkItem> {
  final var LOG = StructuredLogger_ACC.INTEGRATION.withClass(this)

  construct() {
    super(BatchProcessType.TC_MAILHOUSEDOCUMENTUPLOAD_ACC, StandardWorkItem, MailhouseStaging_ACC)
  }

  override function findTargets() : Iterator<MailhouseStaging_ACC> {
    LOG.info("Finding targets..")
    return Query.make(MailhouseStaging_ACC)
        .compareIn(MailhouseStaging_ACC#Status, {MailhouseStagingStatus_ACC.TC_PENDING, MailhouseStagingStatus_ACC.TC_ERROR})
        .join(MailhouseStaging_ACC#MailhouseFile)
        .compare(MailhouseFile_ACC#Status, Relop.Equals, MailhouseFileStatus_ACC.TC_STAGED)
        .withLogSQL(true)
        .select()
        .iterator()
  }

  override function processWorkItem(item : StandardWorkItem) {
    var record = extractTarget(item)

    LOG.info("Processing record: ${record.FileName}")

    // Avoid SharePoint rate limit. HTTP error response 429 - Too Many Requests
    var delayMillis = ScriptParameters.MailhouseDocumentUploadDelayMilliseconds_ACC
    Thread.sleep(delayMillis)

    var account = Account.finder.findAccountByACCID(record.ACCAccountID)
    if (account == null) {
      setStatusInvalid(record, "Account not found: ${record.ACCAccountID}")
      return
    }

    var policy : Policy = null
    if (record.ACCPolicyID != null) {
      policy = InboundDocumentUtil.getPolicy(record.ACCPolicyID)
      if (policy == null) {
        setStatusInvalid(record, "Policy not found: ${record.ACCPolicyID}")
        return
      }
    }

    var filePath = MailhouseFileUtil.getFilePath(record)

    try {
      using (var fis = new FileInputStream(filePath.toFile())) {
        createDocumentAndUploadToSP(fis, record, account, policy)
      }
    } catch (displayableException : DisplayableException) {
      var cause = displayableException.Cause
      if (cause typeis DocumentStoreException) {
        LOG.error_ACC("Failed to upload file to SharePoint: ${record.FileName}", cause)
        setStatusError(record, cause.Message?.truncate(1300))
      } else {
        LOG.error_ACC("Failed to upload file to SharePoint: ${record.FileName}", displayableException)
        setStatusError(record, displayableException.StackTraceAsString.truncate(1300))
      }
    } catch (e : Exception) {
      LOG.error_ACC("Failed to upload file to SharePoint: ${record.FileName}", e)
      setStatusError(record, e.StackTraceAsString.truncate(1300))
    }
  }

  private function createDocumentAndUploadToSP(fis : FileInputStream, stagingRecord : MailhouseStaging_ACC, account : Account, policy : Policy) {
    final var docType = MailhouseFileUtil.getDocumentType(stagingRecord.FileType)
    final var isInvoice = docType == DocumentType.TC_LEVY_INVOICE

    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      // Create Document record
      var doc = new Document(bundle)
      doc.setInbound(true)
      doc.setDMS(true)
      doc.setAccount(account)
      doc.setPolicy(policy)
      doc.setName(stagingRecord.FileName)
      doc.setMimeType("application/pdf")
      doc.setStatus(DocumentStatusType.TC_FINAL)
      doc.setAuthor("System")
      doc.setInvoiceDate(stagingRecord.DocumentDate)
      doc.setType(docType)
      if (isInvoice) {
        doc.setTaxInvoiceNumber_ACC(stagingRecord.Reference)
      }

      // Set staging record status to Processed
      stagingRecord = bundle.add(stagingRecord)
      stagingRecord.Status = MailhouseStagingStatus_ACC.TC_PROCESSED
      stagingRecord.ErrorMessage = null

      // Upload file to SharePoint via ACCDocumentContentSource plugin
      // This will set doc.DocUID
      Plugins.get(IDocumentContentSource).addDocument(fis, doc)
      // Now we can set the staging record DocUID which has just been received from SharePoint
      stagingRecord.DocUID = doc.DocUID
    })
  }

  private function setStatusInvalid(record : MailhouseStaging_ACC, msg : String) {
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      record = bundle.add(record)
      record.Status = MailhouseStagingStatus_ACC.TC_INVALID
      record.ErrorMessage = msg
    })
  }

  private function setStatusError(record : MailhouseStaging_ACC, msg : String) {
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      record = bundle.add(record)
      record.Status = MailhouseStagingStatus_ACC.TC_ERROR
      record.ErrorMessage = msg
    })
  }

}