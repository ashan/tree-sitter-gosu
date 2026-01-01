package nz.co.acc.gwer.inbound

uses com.guidewire.inboundfile.handler.BaseInboundFileHandler
uses gw.api.intentionallogging.IntentionalLogger
uses gw.pl.persistence.core.Bundle
uses gw.pl.util.csv.CSVParser
uses gw.surepath.suite.integration.logging.StructuredLogger_ACC
uses nz.co.acc.common.integration.bulkupload.error.RowProcessError
uses nz.co.acc.gwer.upload.parser.ERClaimLiableEmployerUploadParser
uses nz.co.acc.gwer.upload.processor.BulkERClaimLiableEmployerProcessor
uses nz.co.acc.gwer.util.ERProcessUtils_ACC
uses org.slf4j.Marker

uses java.math.BigDecimal
uses java.text.SimpleDateFormat

uses entity.InboundFileConfig

class ERClaimsExtractFileHandler_ACC extends BaseInboundFileHandler {
  var _erProcessUtils : ERProcessUtils_ACC
  var _claimsParser : ERClaimLiableEmployerUploadParser
  private static final var _logger = StructuredLogger_ACC.INTEGRATION.withClass(ERClaimsExtractFileHandler_ACC)
  construct(inboundFileConfig : InboundFileConfig) {
    super(inboundFileConfig)
    _erProcessUtils = new ERProcessUtils_ACC()
    _claimsParser = new ERClaimLiableEmployerUploadParser()
  }

  override function shouldIgnore(line : String, lineNumber : int) : boolean {
    if(lineNumber == 1 or !line.HasContent) {
      return true
    }
    return false
  }

  override function process(inboundRecord : InboundRecord, bundle : Bundle, intentionalLogger : IntentionalLogger, marker : Marker) {
    if(inboundRecord.LineNumber == 1) {
      inboundRecord.Status = InboundRecordStatus.TC_IGNORE
    } else {
      var parser = new CSVParser(inboundRecord.Content)
      var results = _claimsParser.parseRow(parser)
      if(results.isRight) {
        new BulkERClaimLiableEmployerProcessor().createOrUpdateClaimRecord(inboundRecord.LineNumber, results.right)
      } else {
        throw new RuntimeException(results.left*.Message.toString())
      }
    }
  }

  function encryptString(value : String) : String {
    if(value != null and value.HasContent) {
      return _erProcessUtils.encrypt(value)
    }
    return null
  }
}