package nz.co.acc.integration.ir.inbound.transformer

uses org.apache.commons.lang3.builder.ToStringBuilder
uses org.apache.commons.lang3.builder.ToStringStyle

class CREGFileTrailer {
  public var recordType: String
  public var fileID: String
  public var numberOfRecords: Integer

  public construct() {
  }

  public construct(line: String) {
    validateRecordType(line)
    var reader = new FixedWidthFieldReader(line)
    recordType = reader.nextString(1)
    fileID = reader.nextString(10)
    numberOfRecords = reader.nextString(8).toInt()
  }

  private function validateRecordType(line: String) {
    var firstChar = line.charAt(0)
    if (firstChar != InboundIRConstants.TRAILER_RECORD_TYPE) {
      throw new IRLoadException("Invalid record type: '${firstChar}'")
    }
  }

  override function toString() : String {
    return new ToStringBuilder(this, ToStringStyle.SHORT_PREFIX_STYLE)
        .append("recordType", recordType)
        .append("fileID", fileID)
        .append("numberOfRecords", numberOfRecords)
        .toString()
  }

}