package gw.plugin.billing.bc900

uses gw.api.util.MonetaryAmounts
uses gw.pl.currency.MonetaryAmount
uses wsi.remote.gw.webservice.bc.bc900.entity.anonymous.elements.BillingInstructionInfo_PolicyLines_ACC
uses wsi.remote.gw.webservice.bc.bc900.entity.types.complex.BillingInstructionInfo
uses wsi.remote.gw.webservice.bc.bc900.entity.anonymous.elements.BillingInstructionInfo_ChargeInfos

uses wsi.remote.gw.webservice.bc.bc900.entity.types.complex.PolicyLine_ACC

@Export
@Deprecated(:value="900 inter-app integration packages will be removed in PC11.", :version="PC 10.0.0")
enhancement BillingInstructionInfoEnhancement : BillingInstructionInfo {
  function syncBasicPolicyInfo(period : PolicyPeriod) {
    startSyncBasicPolicyInfo(period)
    ChargeInfoUtil.getChargeInfos( period ).each(\ c -> {
      var element = new BillingInstructionInfo_ChargeInfos()
      element.$TypeInstance = c
      this.ChargeInfos.add(element)
    })
  }

  private function startSyncBasicPolicyInfo(period : PolicyPeriod){
    this.TermNumber = period.TermNumber
    this.PolicyNumber = period.PolicyNumber
    this.PCPolicyPublicID = period.Policy.PublicID
    this.ACCPolicyID_ACC = period.ACCPolicyID_ACC
    this.EffectiveDate = period.EditEffectiveDate.XmlDateTime
    this.Description = period.Job.Description
    this.DepositRequirement = calculateDeposit(period)?.toString()
    this.HasScheduledFinalAudit = period.hasScheduledFinalAudit() or period.hasOpenFinalAudit()
    this.TermConfirmed = period.PolicyTerm.Bound
    this.OfferNumber = period.Job.JobNumber
    for (policyLine in period.Lines) {
      var line = new PolicyLine_ACC()
      line.PatternCode = policyLine.PatternCode
      var element = new BillingInstructionInfo_PolicyLines_ACC()
      element.$TypeInstance = line
      this.PolicyLines_ACC.add(element)
    }
  }

  private function calculateDeposit(period : PolicyPeriod) : MonetaryAmount {
    var job = period.Job
    if(job typeis Audit and job.AuditInformation.AuditScheduleType == TC_PREMIUMREPORT){
      return null
    }
    return period.PolicyTerm.DepositReleased ? MonetaryAmounts.zeroOf(period.PreferredSettlementCurrency) : period.PolicyTerm.DepositAmount
  }
}
