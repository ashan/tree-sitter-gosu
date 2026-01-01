package nz.co.acc.plm.integration.files.inbound.transformer


uses gw.pl.persistence.core.Bundle
uses nz.co.acc.common.integration.files.inbound.LineMessageTransformer
uses nz.co.acc.plm.integration.files.inbound.InboundDocument
uses nz.co.acc.plm.integration.files.inbound.utils.ConstantPropertyHelper
uses nz.co.acc.plm.integration.files.inbound.utils.InboundDocumentUtil


uses java.text.ParseException
uses java.text.SimpleDateFormat

/**
 * Soft deletes from bad Mailhouse control files.
 * Mailhouse control files are of the same format, so this Delete Document transformer can be used for both Invoice and Letters.
 * <p>
 * <p>
 * Created by Nick Mei on 01/09/2018.
 */
class DeleteDocumentsTransformer extends LineMessageTransformer {

  public var _inboundDocument: InboundDocument

  construct(msg: String) {
    super(msg)
  }

  construct(bundle: Bundle, fileInboundMessage: FileInboundMessage_ACC) {
    super(fileInboundMessage);
    var funcName = "construct"
    try {
      this.parse()
      if (_inboundDocument != null) {
        InboundDocumentUtil.deleteDocument(bundle, _inboundDocument)
      }
    } catch (e: Exception) {
      logError("Could not delete document for FileInboundMessage_ACC.ID=${fileInboundMessage.ID}}", funcName, e)
      throw e
    }
  }

  override function parse() {
    var funcName = "parse"
    var msgArray = this._msg.split("~")
    if (msgArray[0] != "OutboundFile") {
      _inboundDocument = new InboundDocument()
      _inboundDocument.Filename = msgArray[0]
      //Ignore msgArray[1] we don't need it for this type of process.
      var df = new SimpleDateFormat(ConstantPropertyHelper.MAILHOUSE_DOCUMENT_METADATA_DATE_FORMAT);
      var docDate: Date
      try {
        docDate = df.parse(msgArray[2]);
        _inboundDocument.Date = docDate
      } catch (e: ParseException) {
        logError("Document parsing issue with date format for FileInboundMessage_ACC.ID=${_fileInboundMessage.ID}. Needs to be ${ConstantPropertyHelper.MAILHOUSE_DOCUMENT_METADATA_DATE_FORMAT}", funcName, e)
      }
      _inboundDocument.ACCID = msgArray[3]
      _inboundDocument.SP_GUID = msgArray[5]
    }
  }

  function transform(): KeyableBean {
    return null
  }

}