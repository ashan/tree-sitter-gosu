package nz.co.acc.plm.integration.files.inbound.transformer


uses gw.pl.persistence.core.Bundle
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.integration.files.inbound.LineMessageTransformer
uses nz.co.acc.plm.integration.files.inbound.InboundDocument
uses nz.co.acc.plm.integration.files.inbound.utils.ConstantPropertyHelper
uses nz.co.acc.plm.integration.files.inbound.utils.InboundDocumentUtil

uses java.text.ParseException
uses java.text.SimpleDateFormat

/**
 * Created by Nithy on 03/05/2017.
 */
class MailhouseLevyInvoiceTransformer extends LineMessageTransformer {

  public var _inboundDocument : InboundDocument

  construct(msg: String) {
    super(msg)
  }

  construct(bundle:Bundle, fileInboundMessage:FileInboundMessage_ACC) {
    super(fileInboundMessage);
    try {
      this.parse()
      if (_inboundDocument != null) {
        InboundDocumentUtil.createDocument(bundle, _inboundDocument)
      }
    } catch (e: Exception) {
      StructuredLogger.INTEGRATION_FILE.error_ACC(e.getMessage())
      throw e
    }
  }

  override function parse() {
    var funcName = "parse"
    var msgArray = this._msg.split("~")
    if (msgArray[0] != "OutboundFile") {
      _inboundDocument = new InboundDocument()
      _inboundDocument.Filename = msgArray[0]
      _inboundDocument.InvoiceNumber = msgArray[1]

      var df = new SimpleDateFormat(ConstantPropertyHelper.MAILHOUSE_DOCUMENT_METADATA_DATE_FORMAT);
      var docDate : Date
      try {
        docDate = df.parse(msgArray[2]);
        _inboundDocument.Date = docDate
      } catch (e:ParseException) {
        logError("Document parsing issue with date format for FileInboundMessage_ACC.ID=${_fileInboundMessage.ID}. Needs to be ${ConstantPropertyHelper.MAILHOUSE_DOCUMENT_METADATA_DATE_FORMAT}", funcName, e)
      }
      _inboundDocument.ACCID = msgArray[3]
      _inboundDocument.PolicyNumber = msgArray[4]
      _inboundDocument.SP_GUID = msgArray[5]
      _inboundDocument.DocType = DocumentType.TC_LEVY_INVOICE
    }
  }
  function transform() : KeyableBean{
    return null
  }

}