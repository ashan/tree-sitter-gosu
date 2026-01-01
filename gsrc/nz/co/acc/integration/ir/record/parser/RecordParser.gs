package nz.co.acc.integration.ir.record.parser

uses nz.co.acc.integration.ir.record.CARA4Record
uses nz.co.acc.integration.ir.record.CARA5Record
uses nz.co.acc.integration.ir.record.CARA6Record
uses nz.co.acc.integration.ir.record.CREGRecord

/**
 * Created by Mike Ourednik on 14/07/2019.
 */
class RecordParser implements IRecordParser {

  override function parseCREGPayload(inboundRecordPublicID : String, payload : String) : RecordParserResult<CREGRecord> {
    var parser = new PropertiesParser(payload)
    var record = new CREGRecord()

    record.InboundRecordPublicID = inboundRecordPublicID
    record.AccNumber = parser.getStringMandatory("CustomerUpdate.Business.ACCNumber").RightValueOrNull
    record.EmployerClassification = parser.getString("CustomerUpdate.Business.EmployerClassification").RightValueOrNull
    record.EntityClass = parser.getString("CustomerUpdate.Business.EntityClass").RightValueOrNull
    record.EntityType = parser.getStringMandatory("CustomerUpdate.Business.EntityType").RightValueOrNull
    record.ParentACCNumber = parser.getString("CustomerUpdate.Parent.ACCNumber").RightValueOrNull
    record.CellPhone = parser.getString("CustomerUpdate.Business.FaxNumber").RightValueOrNull
    record.IrdReferenceNumber = parser.getString("CustomerUpdate.Business.IRDRefNumber").RightValueOrNull
    record.EmployerName = parser.getString("CustomerUpdate.Business.Name").RightValueOrNull
    record.NatureOfBusiness = parser.getString("CustomerUpdate.Business.NatureOfBusiness").RightValueOrNull
    record.NZBN = parser.getString("CustomerUpdate.Business.NZBN").RightValueOrNull
    record.BusinessPhone = parser.getString("CustomerUpdate.Business.PhoneNumber").RightValueOrNull
    record.TaxTypeEndDate = parser.getDate("CustomerUpdate.Business.TaxTypeEndDate").RightValueOrNull
    record.TaxTypeEndReason = parser.getString("CustomerUpdate.Business.TaxTypeEndReason").RightValueOrNull
    record.TaxTypeStartDate = parser.getDate("CustomerUpdate.Business.TaxTypeStartDate").RightValueOrNull
    record.TradeName = parser.getString("CustomerUpdate.Business.TradeName").RightValueOrNull
    record.Email = parser.getString("CustomerUpdate.Business.Email").RightValueOrNull
    record.AgentCode = parser.getString("CustomerUpdate.Control.AgentCode").RightValueOrNull
    record.ChangeType = parser.getString("CustomerUpdate.Control.ChangeType").RightValueOrNull
    record.IrdSortKey = parser.getString("CustomerUpdate.Control.IRDSortKey").RightValueOrNull
    record.RecordType = parser.getIntegerMandatory("CustomerUpdate.Control.RecordType").RightValueOrNull
    record.DateOfBirth = parser.getDate("CustomerUpdate.Individual.DateOfBirth").RightValueOrNull
    record.FirstNames = parser.getString("CustomerUpdate.Individual.FirstNames").RightValueOrNull
    record.LastName = parser.getString("CustomerUpdate.Individual.LastName").RightValueOrNull
    record.HomePhone = parser.getString("CustomerUpdate.Individual.PhoneNumber").RightValueOrNull
    record.Title = parser.getString("CustomerUpdate.Individual.Title").RightValueOrNull
    record.PhysicalAddressLine1 = parser.getString("CustomerUpdate.PhysicalAddress.AddressLine1").RightValueOrNull
    record.PhysicalAddressLine2 = parser.getString("CustomerUpdate.PhysicalAddress.AddressLine2").RightValueOrNull
    record.PhysicalAddressChangeDate = parser.getDate("CustomerUpdate.PhysicalAddress.ChangeDate").RightValueOrNull
    record.PhysicalAddressPostalcode = parser.getString("CustomerUpdate.PhysicalAddress.PostCode").RightValueOrNull
    record.PhysicalAddressStatusIndicator = parser.getString("CustomerUpdate.PhysicalAddress.StatusIndicatorFlag").RightValueOrNull
    record.PostalAddressLine1 = parser.getString("CustomerUpdate.PostalAddress.AddressLine1").RightValueOrNull
    record.PostalAddressLine2 = parser.getString("CustomerUpdate.PostalAddress.AddressLine2").RightValueOrNull
    record.PostalAddressChangeDate = parser.getDate("CustomerUpdate.PostalAddress.ChangeDate").RightValueOrNull
    record.PostalAddressPostalcode = parser.getString("CustomerUpdate.PostalAddress.PostCode").RightValueOrNull
    record.PostalAddressStatusIndicator = parser.getString("CustomerUpdate.PostalAddress.StatusIndicatorFlag").RightValueOrNull

    return new RecordParserResult<CREGRecord>(inboundRecordPublicID, record, parser.ParseResults)
  }

  override function parseCARA4Payload(inboundRecordPublicID : String, payload : String) : RecordParserResult<CARA4Record> {
    var parser = new PropertiesParser(payload)
    var record = new CARA4Record()

    record.InboundRecordPublicID = inboundRecordPublicID
    record.AccNumber = parser.getStringMandatory("SelfEmployedEarningsUpdate.Business.ACCNumber").RightValueOrNull
    record.EmployerType = parser.getStringMandatory("SelfEmployedEarningsUpdate.Business.EmployerType").RightValueOrNull
    record.IrdReferenceNumber = parser.getStringMandatory("SelfEmployedEarningsUpdate.Business.IRDRefNumber").RightValueOrNull
    record.EmployerName = parser.getString("SelfEmployedEarningsUpdate.Business.Name").RightValueOrNull
    record.ProcessedDate = parser.getDate("SelfEmployedEarningsUpdate.Control.ProcessedDate").RightValueOrNull
    record.RecordType = parser.getIntegerMandatory("SelfEmployedEarningsUpdate.Control.RecordType").RightValueOrNull
    record.BalanceDate = parser.getString("SelfEmployedEarningsUpdate.Financials.BalanceDate").RightValueOrNull
    record.Expenses = parser.getBigDecimal("SelfEmployedEarningsUpdate.Financials.Expenses").RightValueOrNull
    record.GrossEmployeeEarnings = parser.getBigDecimal("SelfEmployedEarningsUpdate.Financials.GrossEmployeeEarnings").RightValueOrNull
    record.LTCIncome = parser.getBigDecimal("SelfEmployedEarningsUpdate.Financials.LTCIncome").RightValueOrNull
    record.OtherIncome = parser.getBigDecimal("SelfEmployedEarningsUpdate.Financials.OtherIncome").RightValueOrNull
    record.OverseasIncome = parser.getBigDecimal("SelfEmployedEarningsUpdate.Financials.OverseasIncome").RightValueOrNull
    record.PartnershipIncome = parser.getBigDecimal("SelfEmployedEarningsUpdate.Financials.PartnershipIncome").RightValueOrNull
    record.PremiumYear = parser.getIntegerMandatory("SelfEmployedEarningsUpdate.Financials.PremiumYear").RightValueOrNull
    record.EarningsToPAYE = parser.getBigDecimal("SelfEmployedEarningsUpdate.Financials.EarningsToPAYE").RightValueOrNull
    record.ShareholderEmployeeSalaryNotLiable = parser.getBigDecimal("SelfEmployedEarningsUpdate.Financials.ShareholderEmployeeSalaryNotLiable").RightValueOrNull
    record.TotalGrossPayments = parser.getBigDecimal("SelfEmployedEarningsUpdate.Financials.TotalGrossPayments").RightValueOrNull
    record.TotalIncomeNotLiableForEP = parser.getBigDecimal("SelfEmployedEarningsUpdate.Financials.TotalIncomeNotLiableForEP").RightValueOrNull

    return new RecordParserResult<CARA4Record>(inboundRecordPublicID, record, parser.ParseResults)
  }

  override function parseCARA5Payload(inboundRecordPublicID : String, payload : String) : RecordParserResult<CARA5Record> {
    var parser = new PropertiesParser(payload)
    var record = new CARA5Record()

    record.InboundRecordPublicID = inboundRecordPublicID
    record.AccNumber = parser.getStringMandatory("ShareholderEmployerEarningsUpdate.Business.ACCNumber").RightValueOrNull
    record.EmployerType = parser.getStringMandatory("ShareholderEmployerEarningsUpdate.Business.EmployerType").RightValueOrNull
    record.IrdReferenceNumber = parser.getStringMandatory("ShareholderEmployerEarningsUpdate.Business.IRDRefNumber").RightValueOrNull
    record.EmployerName = parser.getString("ShareholderEmployerEarningsUpdate.Business.Name").RightValueOrNull
    record.ProcessedDate = parser.getDate("ShareholderEmployerEarningsUpdate.Control.ProcessedDate").RightValueOrNull
    record.RecordType = parser.getIntegerMandatory("ShareholderEmployerEarningsUpdate.Control.RecordType").RightValueOrNull
    record.BalanceDate = parser.getString("ShareholderEmployerEarningsUpdate.Financials.BalanceDate").RightValueOrNull
    record.PremiumYear = parser.getIntegerMandatory("ShareholderEmployerEarningsUpdate.Financials.PremiumYear").RightValueOrNull
    record.ACCNumberShareholder = parser.getString("ShareholderEmployerEarningsUpdate.Shareholder.ACCNumber").RightValueOrNull
    record.Name = parser.getString("ShareholderEmployerEarningsUpdate.Shareholder.Name").RightValueOrNull
    record.Remuneration = parser.getBigDecimal("ShareholderEmployerEarningsUpdate.Shareholder.Remuneration").RightValueOrNull

    return new RecordParserResult<CARA5Record>(inboundRecordPublicID, record, parser.ParseResults)
  }

  override function parseCARA6Payload(inboundRecordPublicID : String, payload : String) : RecordParserResult<CARA6Record> {
    var parser = new PropertiesParser(payload)
    var record = new CARA6Record()

    record.InboundRecordPublicID = inboundRecordPublicID
    record.AccNumber = parser.getStringMandatory("EmployerEarningsUpdate.Business.ACCNumber").RightValueOrNull
    record.EmployerType = parser.getStringMandatory("EmployerEarningsUpdate.Business.EmployerType").RightValueOrNull
    record.IrdReferenceNumber = parser.getStringMandatory("EmployerEarningsUpdate.Business.IRDRefNumber").RightValueOrNull
    record.EmployerName = parser.getString("EmployerEarningsUpdate.Business.Name").RightValueOrNull
    record.RecordType = parser.getIntegerMandatory("EmployerEarningsUpdate.Control.RecordType").RightValueOrNull
    record.BalanceDate = parser.getString("EmployerEarningsUpdate.Financials.BalanceDate").RightValueOrNull
    record.EarningsNotLiable = parser.getBigDecimal("EmployerEarningsUpdate.Financials.EarningsNotLiable").RightValueOrNull
    record.GrossEarnings = parser.getBigDecimal("EmployerEarningsUpdate.Financials.GrossEarnings").RightValueOrNull
    record.GrossWithholdingTax = parser.getBigDecimal("EmployerEarningsUpdate.Financials.GrossWithholdingTax").RightValueOrNull
    record.MaximumEarnings = parser.getBigDecimal("EmployerEarningsUpdate.Financials.MaximumEarnings").RightValueOrNull
    record.PremiumYear = parser.getIntegerMandatory("EmployerEarningsUpdate.Financials.PremiumYear").RightValueOrNull

    return new RecordParserResult<CARA6Record>(inboundRecordPublicID, record, parser.ParseResults)
  }

  /**
   * Created by Mike Ourednik on 18/08/2019.
   */
  public static class RecordParserResult<T> {
    var _inboundRecordPublicID : String as readonly InboundRecordPublicID
    var _record : T as readonly Record
    var _parseResults : List<PropertiesParser.PropertiesParserResult>as readonly ParseResults
    var _isPayloadValid : boolean as readonly IsPayloadValid = false

    public construct(inboundRecordPublicID : String, record : T, parseResults : List<PropertiesParser.PropertiesParserResult>) {
      _inboundRecordPublicID = inboundRecordPublicID
      _record = record
      _parseResults = parseResults
      _isPayloadValid = parseResults.allMatch(\vr -> vr.isValid())
    }

    public function getValidationErrors() : String {
      return _parseResults
          .where(\vr -> !vr.isValid())
          .join(",")
    }
  }

}