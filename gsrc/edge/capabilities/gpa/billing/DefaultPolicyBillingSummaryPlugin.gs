package edge.capabilities.gpa.billing

uses edge.capabilities.gpa.billing.dto.PolicyBillingSummaryDTO
uses edge.di.annotations.ForAllGwNodes
uses gw.plugin.Plugins
uses gw.plugin.billing.IBillingSummaryPlugin
uses gw.plugin.billing.BillingPeriodInfo


class DefaultPolicyBillingSummaryPlugin implements IPolicyBillingSummaryPlugin {

  var _billingSummaryPlugin : IBillingSummaryPlugin
  var _policyPeriodBillingSummaryPlugin : IPolicyPeriodBillingSummaryPlugin

  @ForAllGwNodes
  construct(aPolicyPeriodBillingSummaryPlugin : IPolicyPeriodBillingSummaryPlugin){
    this._billingSummaryPlugin = Plugins.get(IBillingSummaryPlugin)
    this._policyPeriodBillingSummaryPlugin = aPolicyPeriodBillingSummaryPlugin
  }

  protected function toDTO(aPolicy : Policy): PolicyBillingSummaryDTO {
    final var dto = new PolicyBillingSummaryDTO()
    dto.PolicyPeriodBillingSummaries = _policyPeriodBillingSummaryPlugin.getPolicyPeriodBillingSummariesForPolicy(aPolicy)

    return dto
  }

  protected function getPolicyPeriodBillingInfo(policyNumber : String, termNumber : int) : BillingPeriodInfo{
    return _billingSummaryPlugin.retrievePolicyBillingSummary(policyNumber, termNumber)
  }

  override function getPolicyBillingSummary(aPolicy : Policy) : PolicyBillingSummaryDTO{
    return toDTO(aPolicy)
  }
}
