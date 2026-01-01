package nz.co.acc.integration.ir.record

uses org.apache.commons.lang3.builder.EqualsBuilder
uses org.apache.commons.lang3.builder.HashCodeBuilder

uses java.math.BigDecimal

/**
 * Self Employed Earnings
 * <p>
 * Created by Mike Ourednik on 14/07/2019.
 */
class CARA4Record extends AbstractIRRecord {
  var business_name: String as EmployerName
  var business_irdRefNumber: String as IrdReferenceNumber
  var control_recordType: Integer as RecordType

  var business_employerType: String as EmployerType
  var financials_balanceDate: String as BalanceDate
  var financials_premiumYear: Integer as PremiumYear

  var control_processedDate : Date as ProcessedDate
  var financials_earningsToPAYE : BigDecimal as EarningsToPAYE
  var financials_expenses : BigDecimal as Expenses
  var financials_grossEmployeeEarnings : BigDecimal as GrossEmployeeEarnings
  var financials_lTCIncome : BigDecimal as LTCIncome
  var financials_originalEarnings : BigDecimal as OriginalEarnings
  var financials_otherIncome : BigDecimal as OtherIncome
  var financials_overseasIncome : BigDecimal as OverseasIncome
  var financials_partnershipIncome : BigDecimal as PartnershipIncome
  var financials_shareholderEmployeeSalaryNotLiable : BigDecimal as ShareholderEmployeeSalaryNotLiable
  var financials_totalGrossPayments : BigDecimal as TotalGrossPayments
  var financials_totalIncomeNotLiableForEP : BigDecimal as TotalIncomeNotLiableForEP

  override function toString() : String {
    return "CARA4Record(inboundPublicID=${this.InboundRecordPublicID}, accID=${this.AccNumber})"
  }

  override function equals(o : Object) : boolean {
    if (this === o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    var that = o as CARA4Record;
    return new EqualsBuilder()
        .append(control_processedDate, that.control_processedDate)
        .append(financials_earningsToPAYE, that.financials_earningsToPAYE)
        .append(financials_expenses, that.financials_expenses)
        .append(financials_grossEmployeeEarnings, that.financials_grossEmployeeEarnings)
        .append(financials_lTCIncome, that.financials_lTCIncome)
        .append(financials_originalEarnings, that.financials_originalEarnings)
        .append(financials_otherIncome, that.financials_otherIncome)
        .append(financials_overseasIncome, that.financials_overseasIncome)
        .append(financials_partnershipIncome, that.financials_partnershipIncome)
        .append(financials_shareholderEmployeeSalaryNotLiable, that.financials_shareholderEmployeeSalaryNotLiable)
        .append(financials_totalGrossPayments, that.financials_totalGrossPayments)
        .append(financials_totalIncomeNotLiableForEP, that.financials_totalIncomeNotLiableForEP)
            // Common fields
        .append(InboundRecordPublicID, that.InboundRecordPublicID)
        .append(AccNumber, that.AccNumber)
        .append(EmployerName, that.EmployerName)
        .append(IrdReferenceNumber, that.IrdReferenceNumber)
        .append(RecordType, that.RecordType)
            // Earnings fields
        .append(EmployerType, that.EmployerType)
        .append(BalanceDate, that.BalanceDate)
        .append(PremiumYear, that.PremiumYear)
        .isEquals();
  }

  override function hashCode() : int {
    return new HashCodeBuilder(17, 37)
        .append(control_processedDate)
        .append(financials_earningsToPAYE)
        .append(financials_expenses)
        .append(financials_grossEmployeeEarnings)
        .append(financials_lTCIncome)
        .append(financials_originalEarnings)
        .append(financials_otherIncome)
        .append(financials_overseasIncome)
        .append(financials_partnershipIncome)
        .append(financials_shareholderEmployeeSalaryNotLiable)
        .append(financials_totalGrossPayments)
        .append(financials_totalIncomeNotLiableForEP)
            // Common fields
        .append(InboundRecordPublicID)
        .append(AccNumber)
        .append(EmployerName)
        .append(IrdReferenceNumber)
        .append(RecordType)
            // Earnings fields
        .append(EmployerType)
        .append(BalanceDate)
        .append(PremiumYear)
        .toHashCode();
  }
}