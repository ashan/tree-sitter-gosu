package nz.co.acc.integration.ir.record

uses org.apache.commons.lang3.builder.EqualsBuilder
uses org.apache.commons.lang3.builder.HashCodeBuilder

uses java.math.BigDecimal

/**
 * Employer Earnings
 * <p>
 * Created by Mike Ourednik on 14/07/2019.
 */
class CARA6Record extends AbstractIRRecord {

  var business_name: String as EmployerName
  var business_irdRefNumber: String as IrdReferenceNumber
  var control_recordType: Integer as RecordType

  var business_employerType: String as EmployerType
  var financials_balanceDate: String as BalanceDate
  var financials_premiumYear: Integer as PremiumYear

  var financials_earningsNotLiable : BigDecimal as EarningsNotLiable
  var financials_grossEarnings : BigDecimal as GrossEarnings
  var financials_grossWithholdingTax : BigDecimal as GrossWithholdingTax
  var financials_maximumEarnings : BigDecimal as MaximumEarnings

  override function toString() : String {
    return "CARA6Record(inboundPublicID=${this.InboundRecordPublicID}, accID=${this.AccNumber})"
  }

  override function equals(o : Object) : boolean {
    if (this === o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    var that = o as CARA6Record;
    return new EqualsBuilder()
        .append(financials_earningsNotLiable, that.financials_earningsNotLiable)
        .append(financials_grossEarnings, that.financials_grossEarnings)
        .append(financials_grossWithholdingTax, that.financials_grossWithholdingTax)
        .append(financials_maximumEarnings, that.financials_maximumEarnings)
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
        .append(financials_earningsNotLiable)
        .append(financials_grossEarnings)
        .append(financials_grossWithholdingTax)
        .append(financials_maximumEarnings)
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