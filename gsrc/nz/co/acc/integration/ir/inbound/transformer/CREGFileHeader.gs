package nz.co.acc.integration.ir.inbound.transformer

uses org.apache.commons.lang3.builder.ToStringBuilder
uses org.apache.commons.lang3.builder.ToStringStyle

class CREGFileHeader implements IRFileHeaderRecord {
  public var _recordType : String
  public var _runID : String
  public var _runDate : String
  public var _runTime : String
  public var _fileNumber : String

  public construct() {
  }

  public construct(line : String) {
    validateRecordType(line)

    var reader = new FixedWidthFieldReader(line)
    _recordType = reader.nextString(1)
    _runID = reader.nextString(10)
    _runDate = reader.nextString(8)
    _runTime = reader.nextString(6)
    _fileNumber = reader.nextString(8)
  }

  private function validateRecordType(line: String) {
    var firstChar = line.charAt(0)
    if (firstChar != InboundIRConstants.HEADER_RECORD_TYPE) {
      throw new IRLoadException("Invalid record type: '${firstChar}'")
    }
  }

  override property get IRInboundBatchID(): String {
    return this._runID + this._runDate + this._runTime + this._fileNumber
  }

  override property get ExternalKey(): String {
    return "EK-" + _fileNumber
  }

  override property get RunDate(): String {
    return _runDate
  }
  
  override property get IRInboundFeedType(): IRInboundFeedType_ACC {
    return IRInboundFeedType_ACC.TC_REGISTRATIONS
  }

  override function toString() : String {
    return new ToStringBuilder(this, ToStringStyle.SHORT_PREFIX_STYLE)
        .append("recordType", _recordType)
        .append("runID", _runID)
        .append("runDate", _runDate)
        .append("runTime", _runTime)
        .append("fileNumber", _fileNumber)
        .toString()
  }
  
}