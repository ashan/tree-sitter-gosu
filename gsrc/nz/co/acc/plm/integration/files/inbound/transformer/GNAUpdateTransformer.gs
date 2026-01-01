package nz.co.acc.plm.integration.files.inbound.transformer

uses gw.pl.persistence.core.Bundle
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.integration.files.inbound.utils.InboundUtility
uses nz.co.acc.plm.integration.files.inbound.InboundPolicyUpdate
uses nz.co.acc.gna.GNAProcessor


/**
 * Created by Nithy on 2/02/2017.
 */
class GNAUpdateTransformer extends XMLMessageTransformer {
  private static final var DOCUMENT_DATE_FORMAT = "yyyyMMdd"
  private final var _gnaProcessor = new GNAProcessor()

  construct(msg: String) {
    super(msg)
  }

  construct(bundle: Bundle, fileInboundMessage: FileInboundMessage_ACC) {
    super(fileInboundMessage);
    this._bundle = bundle
    try {
      this.parse()
      var policyGNAUpdate = this.transformData()
      if (policyGNAUpdate != null and policyGNAUpdate.DocumentDate < Date.Today) {
        _gnaProcessor.gnaUpdate(this._bundle, policyGNAUpdate)
      }
    } catch (e: Exception) {
      StructuredLogger.INTEGRATION_FILE.error_ACC(e.getMessage())
      throw e
    }
  }

  function  parse(){
      var msgArray = this._msg.split("~")
      _inboundPolicyUpdate = new InboundPolicyUpdate()
      _inboundPolicyUpdate.DocumentType = msgArray[0]

      _inboundPolicyUpdate.FileDocumentID = msgArray[1]
      _inboundPolicyUpdate.DocumentDate = InboundUtility.stringToDate(msgArray[2], DOCUMENT_DATE_FORMAT)
      _inboundPolicyUpdate.DocumentID = _inboundPolicyUpdate.FileDocumentID
  }

}