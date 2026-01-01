package nz.co.acc.lob.aep

uses java.sql.ResultSet

/**
 * AEP Contract report row data.
 */
class AEPContractReportRowData {
  var _aepContractNumber_ACC : String as AEPContractNumber_ACC
  var _accountName : String as AccountName
  var _primeAccountNumber : String as PrimeAccountNumber
  var _aepAgreementOrigSignedDate_ACC : String as AEPAgreementOrigSignedDate_ACC
  var _statusOfAccount : String as StatusOfAccount
  var _relationshipManager : String as RelationshipManager
  var _rmPhone : String as RMPhone
  var _rmEmail : String as RMEmail
  var _complianceAdvisor : String as ComplianceAdvisor
  var _caPhone : String as CAPhone
  var _caEmail : String as CAEmail
  var _aepPlanStartDate : String as AEPPlanStartDate
  var _aepPlanEndDate : String as AEPPlanEndDate
  var _contractPlanType : String as ContractPlanType
  var _claimManagementPeriod : String as ClaimManagementPeriod
  var _highCostClaimsCover : String as HighCostClaimsCover
  var _stopLossPercentage : Long as StopLossPercentage
  var _auditResult : String as AuditResult
  var _validForClaimsReg_ACC : String as ValidForClaimsReg_ACC
  var _numberFTEs : String as NumberFTEs

  construct(resultSet : ResultSet) {
    _aepContractNumber_ACC = resultSet.getString("AEPContractNumber_ACC")
    _accountName = resultSet.getString("AccountName")
    _primeAccountNumber = resultSet.getString("PrimeAccountNumber")
    _aepAgreementOrigSignedDate_ACC = resultSet.getString("AEPAgreementOrigSignedDate_ACC")
    _statusOfAccount = resultSet.getString("StatusOfAccount")
    _relationshipManager = resultSet.getString("RelationshipManager")
    _rmPhone = resultSet.getString("RMPhone")
    _rmEmail = resultSet.getString("RMEmail")
    _complianceAdvisor = resultSet.getString("ComplianceAdvisor")
    _caPhone = resultSet.getString("CAPhone")
    _caEmail = resultSet.getString("CAEmail")
    _aepPlanStartDate = resultSet.getString("AEPPlanStartDate")
    _aepPlanEndDate = resultSet.getString("AEPPlanEndDate")
    _contractPlanType = resultSet.getString("ContractPlanType")
    _claimManagementPeriod = resultSet.getString("ClaimManagementPeriod")
    _highCostClaimsCover = resultSet.getString("HighCostClaimsCover")
    _stopLossPercentage = resultSet.getLong("StopLossPercentage")
    _auditResult = resultSet.getString("AuditResult")
    _validForClaimsReg_ACC = resultSet.getString("ValidForClaimsReg_ACC")
    _numberFTEs = resultSet.getString("NumberFTEs")
  }
}