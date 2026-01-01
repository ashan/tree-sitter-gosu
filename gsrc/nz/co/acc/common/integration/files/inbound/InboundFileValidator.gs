package nz.co.acc.common.integration.files.inbound

uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.integration.files.inbound.utils.InboundFileValidationResponse
uses nz.co.acc.common.integration.files.inbound.utils.InboundUtility

uses java.nio.file.Files
uses java.nio.file.Path
uses java.util.stream.Stream

/**
 * Created by fabianr on 31/01/2017.
 */
public abstract class InboundFileValidator {
  private static var _log = StructuredLogger.INTEGRATION_FILE.withClass(InboundFileValidator)

  protected var _filePath : Path
  protected var _stream : Stream<String>
  protected var _linesArray : List<Object>
  protected var _errors : List<String> as Errors

  construct() {
  }

  construct(filePath : Path) {
    this._filePath = filePath
    this._stream = Files.lines(this._filePath)
    this._linesArray = this._stream.toArray().fastList()
    this._errors = new ArrayList<String>()
  }

  abstract function hasErrors() : List<String>

  protected function addError(error : String) {
    if (error != null) {
      this._errors.add(error)
    }
  }

  public function checkIfEmpty() : String {
    if (this._filePath.toFile().length() == 0) {
      _log.error_ACC("file is empty " + this._filePath.toFile().getName())
      return InboundFileValidationResponse.EMPTY.toString()
    }
    return null
  }

  public function checkHeaderRecordLength(length : Integer) : String {
    var headerLine = this._linesArray.get(0).toString()
    if (headerLine.length() != length) {
      _log.error_ACC(headerLine.length() + " in - " + this._filePath.toFile().getName())
      return InboundFileValidationResponse.HEADER_LENGTH.toString()
    }
    return null
  }

  public function checkHeaderRecordCode(code : String, start : Integer, end : Integer) : String {
    var headerLine = this._linesArray.get(0).toString()
    if (headerLine.substring(start, end) != code) {
      _log.error_ACC(InboundFileValidationResponse.HEADER_RECORD_TYPE + " in - " + this._filePath.toFile().getName())
      return InboundFileValidationResponse.HEADER_RECORD_TYPE.toString()
    }
    return null
  }

  public function checkDetailRecordCode(code : String, start : Integer, end : Integer) : String {
    var detailLine = this._linesArray.get(1).toString()
    if (detailLine.substring(start, end) != code) {
      _log.error_ACC(InboundFileValidationResponse.DETAIL_RECORD_TYPE + " in - " + this._filePath.toFile().getName())
      return InboundFileValidationResponse.DETAIL_RECORD_TYPE.toString()

    }
    return null
  }

  public function checkDetailRecordLength(length : Integer) : String {
    var detailLine = this._linesArray.get(1).toString()
    if (detailLine.length() != length) {
      _log.error_ACC(detailLine.length() + " in - " + this._filePath.toFile().getName())
      return InboundFileValidationResponse.DETAIL_LENGTH.toString()
    }
    return null
  }

  public function checkTrailerRecordLength(length : Integer) : String {
    var tailLine = this._linesArray.last().toString()
    if (tailLine.length() != length) {
      _log.error_ACC(InboundFileValidationResponse.TAIL_LENGTH + " in - " + this._filePath.toFile().getName())
      return InboundFileValidationResponse.TAIL_LENGTH.toString()
    }
    return null
  }

  public function checkTrailerRecordCode(code : String, start : Integer, end : Integer, rowOffset : Integer) : String {
    var tailLine : String
    if (rowOffset == 0) {
      tailLine = this._linesArray.last().toString()
    } else {
      tailLine = this._linesArray.get(this._linesArray.size() - rowOffset).toString()
    }
    if (tailLine.substring(start, end) != code) {
      _log.error_ACC(InboundFileValidationResponse.TAIL_RECORD_TYPE + " in - " + this._filePath.toFile().getName())
      return InboundFileValidationResponse.TAIL_RECORD_TYPE.toString()
    }
    return null
  }

  public function checkDateFormat(dateFormat : String) : String {
    var detailLine = this._linesArray.get(1).toString()
    var msgArray = detailLine.split(",")
    try {
      InboundUtility.stringToDate(msgArray[10], dateFormat)
    } catch (e : Exception) {
      _log.error_ACC(InboundFileValidationResponse.INVALID_SETTLEMENT_DATE_FORMAT + " in - " + this._filePath.toFile().getName())
      return InboundFileValidationResponse.INVALID_SETTLEMENT_DATE_FORMAT.toString()
    }
    return null
  }


}