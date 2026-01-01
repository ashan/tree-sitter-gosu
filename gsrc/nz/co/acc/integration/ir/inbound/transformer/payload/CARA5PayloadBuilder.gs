package nz.co.acc.integration.ir.inbound.transformer.payload

class CARA5PayloadBuilder extends AbstractPayloadBuilder {

  function setBusinessACCNumber(value : String) {
    appendIfNotBlank("ShareholderEmployerEarningsUpdate.Business.ACCNumber", value)
  }

  function setBusinessEmployerType(value : String) {
    appendIfNotBlank("ShareholderEmployerEarningsUpdate.Business.EmployerType", value)
  }

  function setBusinessIRDRefNumber(value : String) {
    appendIfNotBlank("ShareholderEmployerEarningsUpdate.Business.IRDRefNumber", value)
  }

  function setBusinessName(value : String) {
    appendIfNotBlank("ShareholderEmployerEarningsUpdate.Business.Name", value)
  }

  function setControlProcessedDate(value : String) {
    appendIfNotBlank("ShareholderEmployerEarningsUpdate.Control.ProcessedDate", value)
  }

  function setControlRecordType(value : String) {
    appendIfNotBlank("ShareholderEmployerEarningsUpdate.Control.RecordType", value)
  }

  function setFinancialsBalanceDate(value : String) {
    appendIfNotBlank("ShareholderEmployerEarningsUpdate.Financials.BalanceDate", value)
  }

  function setFinancialsPremiumYear(value : String) {
    appendIfNotBlank("ShareholderEmployerEarningsUpdate.Financials.PremiumYear", value)
  }

  function setShareholderACCNumber(value : String) {
    appendIfNotBlank("ShareholderEmployerEarningsUpdate.Shareholder.ACCNumber", value)
  }

  function setShareholderName(value : String) {
    appendIfNotBlank("ShareholderEmployerEarningsUpdate.Shareholder.Name", value)
  }

  function setShareholderRemuneration(value : String) {
    appendIfNotBlank("ShareholderEmployerEarningsUpdate.Shareholder.Remuneration", value)
  }

}