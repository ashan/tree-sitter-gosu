package nz.co.acc.integration.ir.inbound.transformer

uses nz.co.acc.integration.ir.inbound.transformer.payload.CARA6PayloadBuilder

uses java.math.BigDecimal

class CARAFileRecordType6 implements IRFileRecord {
  var recordType : Integer
  var accNumber : String
  var employerType : String
  var premiumYear : String
  var irdReferenceNumber : String
  var grossEarnings : Optional<BigDecimal>
  var grossWithholdingTax : Optional<BigDecimal>
  var earningsNotLiable : Optional<BigDecimal>
  var maximumEarnings : Optional<BigDecimal>
  var balanceDate : String
  var employerName : String

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
    grossEarnings = reader.nextBigDecimal(13)
    grossWithholdingTax = reader.nextBigDecimal(13)
    earningsNotLiable = reader.nextBigDecimal(13)
    maximumEarnings = reader.nextBigDecimal(13)
    balanceDate = reader.nextString(4)
    employerName = reader.nextString(74)
  }

  private function validateRecordType(line : String) {
    var firstChar = line.charAt(0)
    if (firstChar != InboundIRConstants.CARA6_RECORD_TYPE) {
      throw new IRLoadException("Invalid record type: '${firstChar}'")
    }
  }

  override property get AccNumber() : String {
    return accNumber
  }

  override property get RecordType() : IRExtRecordType_ACC {
    return IRExtRecordType_ACC.TC_CARA6
  }

  override function generatePayload() : String {
    var builder = new CARA6PayloadBuilder()

    builder.setBusinessACCNumber(accNumber)
    builder.setBusinessEmployerType(employerType)
    builder.setBusinessIRDRefNumber(irdReferenceNumber)
    builder.setBusinessName(new ProperCaseUtil().capitalize(employerName, true))
    builder.setControlRecordType(recordType.toString())
    builder.setFinancialsBalanceDate(balanceDate)
    builder.setFinancialsEarningsNotLiable(InboundIRUtil.getDecimalString(earningsNotLiable))
    builder.setFinancialsGrossEarnings(InboundIRUtil.getDecimalString(grossEarnings))
    builder.setFinancialsGrossWithholdingTax(InboundIRUtil.getDecimalString(grossWithholdingTax))
    builder.setFinancialsMaximumEarnings(InboundIRUtil.getDecimalString(maximumEarnings))
    builder.setFinancialsPremiumYear(premiumYear)

    return builder.PropertiesString
  }
}