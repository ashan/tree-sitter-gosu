package nz.co.acc.integration.ir.inbound.transformer

uses org.apache.commons.lang3.builder.ToStringBuilder
uses org.apache.commons.lang3.builder.ToStringStyle

class CARAFileHeader implements IRFileHeaderRecord {
  public var _recordType : String
  public var _employerType : String
  public var _fileID : String
  public var _runDate : String
  public var _runTime : String
  public var _fileNumber : String

  public construct() {
  }

  public construct(line : String) {
    validateRecordType(line)

    var reader = new FixedWidthFieldReader(line)
    _recordType = reader.nextString(1)
    reader.nextString(8) // skip
    _employerType = reader.nextString(1)
    reader.nextString(17) // skip
    _fileID = reader.nextString(10)
    _runDate = reader.nextString(8)
    _runTime = reader.nextString(6)
    _fileNumber = reader.nextString(8)
  }

  public property get IRInboundFeedType() : IRInboundFeedType_ACC {
    if (_employerType == "E") {
      return IRInboundFeedType_ACC.TC_EMPLOYEREARNINGS
    } else {
      return IRInboundFeedType_ACC.TC_SELFEMPSHAREHOLDEREARNINGS
    }
  }

  private function validateRecordType(line: String) {
    var firstChar = line.charAt(0)
    if (firstChar != InboundIRConstants.HEADER_RECORD_TYPE) {
      throw new IRLoadException("Invalid record type: '${firstChar}'")
    }
  }

  override function toString() : String {
    return new ToStringBuilder(this, ToStringStyle.SHORT_PREFIX_STYLE)
        .append("recordType", _recordType)
        .append("employerType", _employerType)
        .append("fileID", _fileID)
        .append("runDate", _runDate)
        .append("runTime", _runTime)
        .append("fileNumber", _fileNumber)
        .toString()
  }

  override property get ExternalKey(): String {
    return "EK-" + _fileNumber
  }

  override property get IRInboundBatchID() : String {
    return _fileID + _runDate + _runTime + _fileNumber
  }

  override property get RunDate() : String {
    return _runDate
  }
  
}