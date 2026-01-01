package nz.co.acc.integration.instruction.handler.impl

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.api.locale.DisplayKey
uses gw.api.web.document.DocumentsHelper
uses gw.document.DocumentsActionsUIHelper
uses gw.pl.persistence.core.Bundle
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.integration.instruction.handler.InstructionRecordHandler
uses nz.co.acc.integration.instruction.record.impl.DocumentRemovalInstructionRecord

class DocumentRemovalRecordHandler extends InstructionRecordHandler<DocumentRemovalInstructionRecord> {

  private static final var _log = StructuredLogger.INTEGRATION.withClass(DocumentRemovalRecordHandler)

  construct(instructionRecord : DocumentRemovalInstructionRecord) {
    super(instructionRecord)
  }

  override function processInstructionRecord(bundle : Bundle) {
    _log.info("Processing ${InstructionRecord}")

    // as delete availability condition in UI
    checkDocumentMetadataSource()
    checkDocumentContentSource()

    // retrieve entities
    var targetDocumentPublicID = this.InstructionRecord.DocumentPublicID
    var targetAccountID = this.InstructionRecord.ACCID
    var account = findAccount(targetAccountID)
    if (account == null) {
      throw new RuntimeException("Account not found with ACCID ${targetAccountID}")
    }
    var document = findDocumentOfAccount(targetDocumentPublicID, account)
    if (document == null) {
      throw new RuntimeException("Document with PublicID ${targetDocumentPublicID} not found for account with ACCID ${targetAccountID}")
    }

    // as delete visibility condition on UI
    if (document.PendingDocUID != null) {
      throw new RuntimeException("Document with PublicID ${targetDocumentPublicID} is pending upload into the Document store")
    }

    if (document.DocUID == null) {
      throw new RuntimeException("Document with PublicID ${targetDocumentPublicID} is missing the document storage file identifier (DocUID)")
    }

    // OK to proceed
    _log.info("Removing document via Instruction framework. Account ACCID ${targetAccountID}, DocUID ${document.DocUID}, PublicID ${document.PublicID}")
    document = bundle.add(document)
    DocumentsHelper.deleteDocument(document)

    var historyMessage = DisplayKey.get("Document.BulkRemove.HistoryMessage_ACC", document.Name, document.DocUID, document.PublicID)
    if(document.Job != null) {
      var job = bundle.add(document.Job)
      job.createCustomHistoryEvent(CustomHistoryType.TC_BULK_DOCUMENT_REMOVAL_ACC, \-> historyMessage)
    } else {
      account = bundle.add(account)
      account.createCustomHistoryEvent(CustomHistoryType.TC_BULK_DOCUMENT_REMOVAL_ACC, \-> historyMessage)
    }
  }


  private function checkDocumentMetadataSource() {
    //based on button availability on UI
    if (DocumentsActionsUIHelper.MetadataSourceEnabled) {
      if (not DocumentsActionsUIHelper.DocumentMetadataServerAvailable) {
        throw new RuntimeException("Document Metadata Server not available")
      }
    }
  }

  private function checkDocumentContentSource() {
    //based on button availability on UI
    if (not DocumentsActionsUIHelper.DocumentContentServerAvailable) {
      throw new RuntimeException("Document Content Server not available")
    }
  }

  private function findAccount(accID : String) : Account {
    return Query.make(Account)
        .compare(Account#ACCID_ACC, Relop.Equals, accID)
        .select().AtMostOneRow
  }

  private function findDocumentOfAccount(publicID : String, account : Account) : Document {
    var query = Query.make(Document)
        .compare(Document#Account, Relop.Equals, account)
        .compare(Document#PublicID, Relop.Equals, publicID)
    return query.select().AtMostOneRow
  }

}