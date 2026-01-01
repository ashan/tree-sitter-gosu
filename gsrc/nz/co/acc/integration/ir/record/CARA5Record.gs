package nz.co.acc.integration.ir.record

uses org.apache.commons.lang3.builder.EqualsBuilder
uses org.apache.commons.lang3.builder.HashCodeBuilder

uses java.math.BigDecimal

/**
 * Shareholder Employer Earnings
 * <p>
 * Created by Mike Ourednik on 14/07/2019.
 */
class CARA5Record extends AbstractIRRecord {
  var business_name : String as EmployerName
  var business_irdRefNumber : String as IrdReferenceNumber
  var control_recordType : Integer as RecordType

  var business_employerType : String as EmployerType
  var financials_balanceDate : String as BalanceDate
  var financials_premiumYear : Integer as PremiumYear

  var control_processedDate : Date as ProcessedDate
  var shareholder_accNumber : String as ACCNumberShareholder
  var shareholder_remuneration : BigDecimal as Remuneration
  var shareholder_name : String as Name

  override function toString() : String {
    return "CARA5Record(inboundPublicID=${this.InboundRecordPublicID}, accID=${this.AccNumber}, shareholderACCID=${shareholder_accNumber})"
  }

  override function equals(o : Object) : boolean {
    if (this === o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    var that = o as CARA5Record;
    return new EqualsBuilder()
        .append(control_processedDate, that.control_processedDate)
        .append(shareholder_accNumber, that.shareholder_accNumber)
        .append(shareholder_remuneration, that.shareholder_remuneration)
        .append(shareholder_name, that.shareholder_name)
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
        .append(shareholder_accNumber)
        .append(shareholder_remuneration)
        .append(shareholder_name)
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