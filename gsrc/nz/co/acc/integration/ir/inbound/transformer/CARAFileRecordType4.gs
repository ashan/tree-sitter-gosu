package nz.co.acc.integration.ir.inbound.transformer

uses nz.co.acc.integration.ir.inbound.transformer.payload.CARA4PayloadBuilder

uses java.math.BigDecimal

class CARAFileRecordType4 implements IRFileRecord {
  var recordType : Integer
  var accNumber : String
  var employerType : String
  var premiumYear : String
  var irdReferenceNumber : String
  var grossEmployeeEarnings : Optional<BigDecimal>
  var totalIncomeNotLiableForEP : Optional<BigDecimal>
  var totalGrossPayments : Optional<BigDecimal>
  var overseasIncome : Optional<BigDecimal>
  var partnershipIncome : Optional<BigDecimal>
  var ltcIncome : Optional<BigDecimal>
  var shareholderEmployeeSalaryNotLiable : Optional<BigDecimal>
  var earningsToPAYE : Optional<BigDecimal>
  var otherIncome : Optional<BigDecimal>
  var expenses : Optional<BigDecimal>
  var balanceDate : String
  var companyName : String
  var processDate : String

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
    grossEmployeeEarnings = reader.nextBigDecimal(13)
    totalIncomeNotLiableForEP = reader.nextBigDecimal(13)
    totalGrossPayments = reader.nextBigDecimal(13)
    overseasIncome = reader.nextBigDecimal(13)
    partnershipIncome = reader.nextBigDecimal(13)
    ltcIncome = reader.nextBigDecimal(13)
    shareholderEmployeeSalaryNotLiable = reader.nextBigDecimal(13)
    earningsToPAYE = reader.nextBigDecimal(13)
    otherIncome = reader.nextBigDecimal(13)
    expenses = reader.nextBigDecimal(13)
    balanceDate = reader.nextString(4)
    companyName = reader.nextString(74)
    processDate = reader.nextString(8)
  }

  private function validateRecordType(line : String) {
    var firstChar = line.charAt(0)
    if (firstChar != InboundIRConstants.CARA4_RECORD_TYPE) {
      throw new IRLoadException("Invalid record type: '${firstChar}'")
    }
  }

  override property get AccNumber() : String {
    return accNumber
  }

  override property get RecordType() : IRExtRecordType_ACC {
    return IRExtRecordType_ACC.TC_CARA4
  }

  override function generatePayload() : String {
    var builder = new CARA4PayloadBuilder()

    builder.setBusinessACCNumber(accNumber)
    builder.setBusinessEmployerType(employerType)
    builder.setBusinessIRDRefNumber(irdReferenceNumber)
    builder.setBusinessName(new ProperCaseUtil().capitalize(companyName, true))
    builder.setControlProcessedDate(processDate)
    builder.setFinancialsBalanceDate(balanceDate)
    builder.setFinancialsEarningsToPAYE(InboundIRUtil.getDecimalString(earningsToPAYE))
    builder.setFinancialsExpenses(InboundIRUtil.getDecimalString(expenses))
    builder.setFinancialsGrossEmployeeEarnings(InboundIRUtil.getDecimalString(grossEmployeeEarnings))
    builder.setFinancialsLTCIncome(InboundIRUtil.getDecimalString(ltcIncome))
    builder.setFinancialsOtherIncome(InboundIRUtil.getDecimalString(otherIncome))
    builder.setFinancialsOverseasIncome(InboundIRUtil.getDecimalString(overseasIncome))
    builder.setFinancialsPartnershipIncome(InboundIRUtil.getDecimalString(partnershipIncome))
    builder.setFinancialsPremiumYear(premiumYear)
    builder.setControlRecordType(recordType.toString())
    builder.setFinancialsShareholderEmployeeSalaryNotLiable(InboundIRUtil.getDecimalString(shareholderEmployeeSalaryNotLiable))
    builder.setFinancialsTotalGrossPayments(InboundIRUtil.getDecimalString(totalGrossPayments))
    builder.setFinancialsTotalIncomeNotLiableForEP(InboundIRUtil.getDecimalString(totalIncomeNotLiableForEP))

    return builder.PropertiesString
  }

}