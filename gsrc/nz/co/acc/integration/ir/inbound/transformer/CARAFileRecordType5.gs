package nz.co.acc.integration.ir.inbound.transformer

uses nz.co.acc.integration.ir.inbound.transformer.payload.CARA5PayloadBuilder

uses java.math.BigDecimal

class CARAFileRecordType5 implements IRFileRecord {
  var recordType : Integer
  var accNumber : String
  var employerType : String
  var premiumYear : String
  var irdReferenceNumber : String
  var balanceDate : String
  var companyName : String
  var shareholderAccNumber : String
  var shareholderName : String
  var shareholderRemuneration : Optional<BigDecimal>
  var processedDate : String

  public construct() {
  }

  public construct(line : String) {
    validateRecordType(line)
    line = line.replaceAll("\00", " ")

    var reader = new FixedWidthFieldReader(line)
    recordType = reader.nextInteger(1)
    accNumber = reader.nextString(8)
    employerType = reader.nextString(1)
    premiumYear = reader.nextString(4)
    irdReferenceNumber = reader.nextString(13)
    balanceDate = reader.nextString(4)
    companyName = reader.nextString(74)
    shareholderAccNumber = reader.nextString(8)
    shareholderName = reader.nextString(74)
    shareholderRemuneration = reader.nextBigDecimal(13)
    processedDate = reader.nextString(8)
  }

  private function validateRecordType(line: String) {
    var firstChar = line.charAt(0)
    if (firstChar != InboundIRConstants.CARA5_RECORD_TYPE) {
      throw new IRLoadException("Invalid record type: '${firstChar}'")
    }
  }

  override property get AccNumber() : String {
    return accNumber
  }

  override property get RecordType() : IRExtRecordType_ACC {
    return IRExtRecordType_ACC.TC_CARA5
  }

  override function generatePayload() : String {
    var builder = new CARA5PayloadBuilder()
    var properCaseUtil = new ProperCaseUtil()

    builder.setBusinessACCNumber(accNumber)
    builder.setBusinessEmployerType(employerType)
    builder.setBusinessIRDRefNumber(irdReferenceNumber)
    builder.setBusinessName(properCaseUtil.capitalize(companyName, true))
    builder.setControlRecordType(recordType.toString())
    builder.setControlProcessedDate(processedDate)
    builder.setFinancialsBalanceDate(balanceDate)
    builder.setFinancialsPremiumYear(premiumYear)
    builder.setShareholderACCNumber(shareholderAccNumber)
    builder.setShareholderName(properCaseUtil.capitalize(shareholderName, false))
    builder.setShareholderRemuneration(InboundIRUtil.getDecimalString(shareholderRemuneration))

    return builder.PropertiesString
  }
}