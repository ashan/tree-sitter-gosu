package nz.co.acc.integration.ir.inbound.transformer.payload

class CARA4PayloadBuilder extends AbstractPayloadBuilder {

  function setBusinessACCNumber(value : String) {
    appendIfNotBlank("SelfEmployedEarningsUpdate.Business.ACCNumber", value)
  }

  function setBusinessEmployerType(value : String) {
    appendIfNotBlank("SelfEmployedEarningsUpdate.Business.EmployerType", value)
  }

  function setBusinessIRDRefNumber(value : String) {
    appendIfNotBlank("SelfEmployedEarningsUpdate.Business.IRDRefNumber", value)
  }

  function setBusinessIRDRefNumberSuffix(value : String) {
    appendIfNotBlank("SelfEmployedEarningsUpdate.Business.IRDRefSuffix", value)
  }

  function setBusinessName(value : String) {
    appendIfNotBlank("SelfEmployedEarningsUpdate.Business.Name", value)
  }

  function setControlProcessedDate(value : String) {
    appendIfNotBlank("SelfEmployedEarningsUpdate.Control.ProcessedDate", value)
  }

  function setControlRecordType(value : String) {
    appendIfNotBlank("SelfEmployedEarningsUpdate.Control.RecordType", value)
  }

  function setFinancialsBalanceDate(value : String) {
    appendIfNotBlank("SelfEmployedEarningsUpdate.Financials.BalanceDate", value)
  }

  function setFinancialsEarningsToPAYE(value : String) {
    appendIfNotBlank("SelfEmployedEarningsUpdate.Financials.EarningsToPAYE", value)
  }

  function setFinancialsExpenses(value : String) {
    appendIfNotBlank("SelfEmployedEarningsUpdate.Financials.Expenses", value)
  }

  function setFinancialsGrossEmployeeEarnings(value : String) {
    appendIfNotBlank("SelfEmployedEarningsUpdate.Financials.GrossEmployeeEarnings", value)
  }

  function setFinancialsLTCIncome(value : String) {
    appendIfNotBlank("SelfEmployedEarningsUpdate.Financials.LTCIncome", value)
  }

  function setFinancialsOtherIncome(value : String) {
    appendIfNotBlank("SelfEmployedEarningsUpdate.Financials.OtherIncome", value)
  }

  function setFinancialsOverseasIncome(value : String) {
    appendIfNotBlank("SelfEmployedEarningsUpdate.Financials.OverseasIncome", value)
  }

  function setFinancialsPartnershipIncome(value : String) {
    appendIfNotBlank("SelfEmployedEarningsUpdate.Financials.PartnershipIncome", value)
  }

  function setFinancialsPremiumYear(value : String) {
    appendIfNotBlank("SelfEmployedEarningsUpdate.Financials.PremiumYear", value)
  }

  function setFinancialsShareholderEmployeeSalaryNotLiable(value : String) {
    appendIfNotBlank("SelfEmployedEarningsUpdate.Financials.ShareholderEmployeeSalaryNotLiable", value)
  }

  function setFinancialsTotalGrossPayments(value : String) {
    appendIfNotBlank("SelfEmployedEarningsUpdate.Financials.TotalGrossPayments", value)
  }

  function setFinancialsTotalIncomeNotLiableForEP(value : String) {
    appendIfNotBlank("SelfEmployedEarningsUpdate.Financials.TotalIncomeNotLiableForEP", value)
  }

}