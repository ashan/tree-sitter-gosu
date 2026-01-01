package nz.co.acc.edge.capabilities.policy

uses edge.capabilities.currency.dto.AmountDTO
uses edge.capabilities.policy.local.IPolicyPlugin
uses edge.di.annotations.ForAllNodes
uses gw.pl.currency.MonetaryAmount
uses nz.co.acc.edge.capabilities.gpa.account.dto.HistoryDTO_ACC
uses nz.co.acc.edge.capabilities.helpers.HistoryUtil_ACC
uses nz.co.acc.edge.capabilities.policy.dto.PolicyPeriodDTO_ACC
uses nz.co.acc.edge.capabilities.accountcontact.IAccountContactPlugin_ACC
uses nz.co.acc.edge.capabilities.accountcontact.dto.AccountContactDTO_ACC
uses nz.co.acc.edge.capabilities.policy.lob.util.PolicyLineUtil_ACC
uses nz.co.acc.edge.capabilities.policy.util.PolicyUtil_ACC
uses typekey.Job

uses java.math.BigDecimal

/**
 * Created by lee.teoh on 3/30/2017.
 */
class PolicyPlugin_ACC implements IPolicyPlugin_ACC {

  private var _accountContactPlugin: IAccountContactPlugin_ACC
  private var _policyPlugin: IPolicyPlugin

  @ForAllNodes
  construct(accountContactPlugin: IAccountContactPlugin_ACC, policyPlugin: IPolicyPlugin) {
    this._accountContactPlugin = accountContactPlugin
    this._policyPlugin = policyPlugin
  }

  override function getPolicyContacts(policyPeriod: PolicyPeriod): AccountContactDTO_ACC[] {
    return policyPeriod.AccountContactRoleMap.keySet().map(\accountContact -> _accountContactPlugin.toAccountContactDTO_ACC(accountContact)).toTypedArray()
  }

  override function getPolicyPeriodDetails(policyPeriod: PolicyPeriod): PolicyPeriodDTO_ACC {
    var policyPeriodDTOACC = PolicyPeriodDTO_ACC.fromPolicyPeriodDTO(_policyPlugin.getPolicyPeriodDetails(policyPeriod))
    policyPeriodDTOACC.CeasedTradingDate = policyPeriod.PolicyTerm.CeasedTradingDate_ACC
    policyPeriodDTOACC.HasPendingPolicyChange = policyPeriod.Policy.OpenJobs.hasMatch(\ j ->
        j.SelectedVersion.Status != PolicyPeriodStatus.TC_BOUND and
        j.SelectedVersion.Status != PolicyPeriodStatus.TC_RENEWING)
    policyPeriodDTOACC.HasPendingRenewing = PolicyUtil_ACC.hasPendingRenewing(policyPeriod.ACCPolicyID_ACC)
    policyPeriodDTOACC.LevyCost = BigDecimal.ZERO
    if(policyPeriod.Status != PolicyPeriodStatus.TC_DRAFT) {
      policyPeriodDTOACC.LevyCost = policyPeriod.TotalCostRPT
    }
    if(policyPeriod.Job typeis Renewal) {
      var previousAmount = (PolicyUtil_ACC.getMostRecentPeriodByLevyYear_ACC(policyPeriod.PolicyNumber, policyPeriod.LevyYear_ACC - 1)?.TotalCostRPT_amt ?: BigDecimal.ZERO)
      if(policyPeriod.Status == PolicyPeriodStatus.TC_DRAFT) {
        policyPeriodDTOACC.LevyCostDifference = BigDecimal.ZERO
      } else {
        var currentAmount = policyPeriod?.TotalCostRPT_amt ?: BigDecimal.ZERO
        policyPeriodDTOACC.LevyCostDifference = currentAmount - previousAmount
      }
    } else {
      policyPeriodDTOACC.LevyCostDifference = policyPeriod?.TransactionCostRPT_amt ?: BigDecimal.ZERO
    }

    policyPeriodDTOACC.Status = policyPeriod.PeriodDisplayStatus
    policyPeriodDTOACC.PolicyNumber = policyPeriod.PolicyNumber
    policyPeriodDTOACC.PolicyStatus = policyPeriod.Status.DisplayName
    policyPeriodDTOACC.TotalPremium = AmountDTO.fromMonetaryAmount(policyPeriod.TotalPremiumRPT ?: new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD))
    policyPeriodDTOACC.PublicID = policyPeriod.PublicID
    policyPeriodDTOACC.JobNumber = policyPeriod.Job.JobNumber
    policyPeriodDTOACC.TriggerReason = policyPeriod.Job.TriggerReason_ACC.DisplayName
    policyPeriodDTOACC.JobType = policyPeriod.Job.Subtype.Name
    policyPeriodDTOACC.ActiveTerm = policyPeriod?.PolicyTerm?.ActiveTerm_ACC
    if(policyPeriod.AltBillingAccountNumber_ACC.HasContent) {
      policyPeriodDTOACC.AEPPrimeAccountACCID_ACC = policyPeriod.AltBillingAccountNumber_ACC
    }

    if(policyPeriod.INDCoPLineExists) {
      var minmaxEarnings = new nz.co.acc.lob.cpx.INDCPXCalculateMaximumPreviousEarnings_ACC(policyPeriod)
      policyPeriodDTOACC.ShareholderEarnings = PolicyLineUtil_ACC.convertToHistoricalEarnings(minmaxEarnings.WpsActualLiableEarnings)
    }

    policyPeriodDTOACC.Branch = policyPeriod
    return policyPeriodDTOACC
  }

  override function getPolicyHistory(policyPeriod: PolicyPeriod): HistoryDTO_ACC[] {
    return HistoryUtil_ACC.getHistory(policyPeriod.Policy).map(\history -> HistoryDTO_ACC.fromHistory(history))
  }
}