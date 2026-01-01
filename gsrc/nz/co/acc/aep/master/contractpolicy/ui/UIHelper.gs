package nz.co.acc.aep.master.contractpolicy.ui

uses gw.api.filters.StandardBeanFilter
uses gw.pl.currency.MonetaryAmount

uses java.math.BigDecimal

/**
 * UI helper for AEP Master Contract Policy views.
 */
class UIHelper {
  private var _account : Account
  private var _contractPeriods : List<PolicyPeriodSummary> as readonly ContractPeriods

  construct(account : Account) {
    _account = account
    _contractPeriods = account.IssuedPolicies
                        .where(\elt -> elt.ProductCode == "AccreditedEmployersProgramme")
                        .orderBy(\elt -> elt.PeriodStart)
  }

  property get GroupingStartDate() : Date {
    return _contractPeriods.map(\elt -> elt.PeriodStart).sort().first()
  }

  property get GroupingEndDate() : Date {
    return _contractPeriods.map(\elt -> elt.PeriodEnd).sort().last()
  }

  private function getStopLossLimitCost(period : PolicyPeriodSummary) : AEPCost_ACC {
    var stopLossLimitCost = period.fetchPolicyPeriod().PolicyTerm.findLatestBoundOrAuditedPeriod_ACC().AllCosts.where(\elt -> elt.ChargePattern == ChargePattern.TC_AEP_SLL)?.first()
    return stopLossLimitCost != null ? stopLossLimitCost as AEPCost_ACC : null
  }

  function getStopLossLimit(period : PolicyPeriodSummary) : MonetaryAmount {
    var stopLossLimitCost = getStopLossLimitCost(period)
    return stopLossLimitCost != null ? stopLossLimitCost.getCalculatedStopLossLimitForDisplay() : null
  }

  function getStopLossLimitPercentRisk(period : PolicyPeriodSummary) : Integer {
    return period.fetchPolicyPeriod().PolicyTerm.findLatestBoundOrAuditedPeriod_ACC().AEPLine.StopLossPercentage
  }

  function getStopLossLimitPercentWorkAccountLevy(period : PolicyPeriodSummary) : BigDecimal {
    var stopLossLimitCost = getStopLossLimitCost(period)
    return stopLossLimitCost != null ? stopLossLimitCost.getStopLossLimitWorkAccLevyRatioForDisplay() : null
  }

  function getHighCostClaimsCover(period : PolicyPeriodSummary) : AEPHighCostClaimsCov_ACC {
    return period.fetchPolicyPeriod().PolicyTerm.findLatestBoundOrAuditedPeriod_ACC().AEPLine.HighCostClaimsCover
  }

  function getClaimManagementPeriod(period : PolicyPeriodSummary) : AEPClaimManagePeriod_ACC {
    return period.fetchPolicyPeriod().PolicyTerm.findLatestBoundOrAuditedPeriod_ACC().AEPLine.ClaimManagementPeriod
  }

  function getPlanType(period : PolicyPeriodSummary) : String {
    return period.fetchPolicyPeriod().PolicyTerm.findLatestBoundOrAuditedPeriod_ACC().AEPLine.ContractPlanType.DisplayName
  }

  function getAuditResult(period : PolicyPeriodSummary) : String {
    return period.fetchPolicyPeriod().PolicyTerm.findLatestBoundOrAuditedPeriod_ACC().AEPLine.AuditResult.DisplayName
  }

  function getPlanTerm(period : PolicyPeriodSummary) : String {
    var term = period.fetchPolicyPeriod().PolicyTerm
    var planStartDate = term.AEPPlanStartDate_ACC.format("dd/MM/yyyy")
    var planEndDate = term.AEPPlanEndDate_ACC.format("dd/MM/yyyy")
    return planStartDate + " - " + planEndDate
  }

  property get PlanTermFilter(): StandardBeanFilter[] {
    var planTermFilter = new ArrayList<StandardBeanFilter>();
    var planTermsList = new ArrayList<String>()
    for (period in _contractPeriods) {
      planTermsList.add(getPlanTerm(period))
    }
    var planTermSet = new TreeSet<String>(planTermsList)
    for (planTerm in planTermSet) {
      var filter = new StandardBeanFilter(planTerm, \x -> getPlanTerm(x as PolicyPeriodSummary) == planTerm)
      planTermFilter.add(filter)
    }
    return planTermFilter.toTypedArray()
  }
}