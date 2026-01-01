package nz.co.acc.integration.ir.inbound.transformer.payload

class CARA6PayloadBuilder extends AbstractPayloadBuilder {

  function setBusinessACCNumber(value : String) {
    appendIfNotBlank("EmployerEarningsUpdate.Business.ACCNumber", value)
  }

  function setBusinessEmployerType(value : String) {
    appendIfNotBlank("EmployerEarningsUpdate.Business.EmployerType", value)
  }

  function setBusinessIRDRefNumber(value : String) {
    appendIfNotBlank("EmployerEarningsUpdate.Business.IRDRefNumber", value)
  }

  function setBusinessName(value : String) {
    appendIfNotBlank("EmployerEarningsUpdate.Business.Name", value)
  }

  function setControlRecordType(value : String) {
    appendIfNotBlank("EmployerEarningsUpdate.Control.RecordType", value)
  }

  function setFinancialsBalanceDate(value : String) {
    appendIfNotBlank("EmployerEarningsUpdate.Financials.BalanceDate", value)
  }

  function setFinancialsEarningsNotLiable(value : String) {
    appendIfNotBlank("EmployerEarningsUpdate.Financials.EarningsNotLiable", value)
  }

  function setFinancialsGrossEarnings(value : String) {
    appendIfNotBlank("EmployerEarningsUpdate.Financials.GrossEarnings", value)
  }

  function setFinancialsGrossWithholdingTax(value : String) {
    appendIfNotBlank("EmployerEarningsUpdate.Financials.GrossWithholdingTax", value)
  }

  function setFinancialsMaximumEarnings(value : String) {
    appendIfNotBlank("EmployerEarningsUpdate.Financials.MaximumEarnings", value)
  }

  function setFinancialsPremiumYear(value : String) {
    appendIfNotBlank("EmployerEarningsUpdate.Financials.PremiumYear", value)
  }

}