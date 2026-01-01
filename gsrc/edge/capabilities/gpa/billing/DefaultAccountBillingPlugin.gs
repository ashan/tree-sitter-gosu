package edge.capabilities.gpa.billing

uses edge.PlatformSupport.CurrencyPlatformUtil
uses edge.capabilities.gpa.billing.dto.AccountBillingDTO
uses edge.di.annotations.ForAllGwNodes
uses edge.capabilities.gpa.currency.local.ICurrencyPlugin
uses edge.capabilities.gpa.billing.dto.PolicyPeriodBillingSummaryDTO
uses gw.plugin.billing.IBillingSummaryPlugin
uses gw.plugin.Plugins
uses gw.pl.currency.MonetaryAmount
uses gw.api.util.CurrencyUtil

class DefaultAccountBillingPlugin implements IAccountBillingPlugin {

  private var _currencyPlugin : ICurrencyPlugin
  private var _policyPeriodBillingSummaryPlugin : IPolicyPeriodBillingSummaryPlugin
  private var _billingSummaryPlugin : IBillingSummaryPlugin

  @ForAllGwNodes
  construct(aCurrencyPlugin : ICurrencyPlugin, aPolicyPeriodBillingSummaryPlugin : IPolicyPeriodBillingSummaryPlugin) {
    this._currencyPlugin = aCurrencyPlugin
    this._policyPeriodBillingSummaryPlugin = aPolicyPeriodBillingSummaryPlugin
    this._billingSummaryPlugin = Plugins.get(IBillingSummaryPlugin)
  }


  override function getAccountBillingData(anAccount: Account): AccountBillingDTO {
    final var dto = new AccountBillingDTO()

    dto.OwnedPolicies = _policyPeriodBillingSummaryPlugin.getAccountBilledOwnedPolicies(anAccount)
    dto.UnownedPolicies = _policyPeriodBillingSummaryPlugin.getAccountBilledUnownedPolicies(anAccount)
    calculateAccountBillingData(dto, anAccount, dto.OwnedPolicies.concat(dto.UnownedPolicies))

    return dto
  }

  protected function calculateAccountBillingData(dto : AccountBillingDTO, anAccount: Account, billingPeriods : PolicyPeriodBillingSummaryDTO[]){
    var policies = anAccount.Policies
    var totalBilled = new MonetaryAmount(0, CurrencyUtil.getDefaultCurrency())
    var totalPastDue = new MonetaryAmount(0, CurrencyUtil.getDefaultCurrency())
    var totalUnbilled = new MonetaryAmount(0, CurrencyUtil.getDefaultCurrency())
    dto.Unbilled = _currencyPlugin.toDTO(CurrencyPlatformUtil.toCurrencyAmount(new MonetaryAmount(0, CurrencyUtil.getDefaultCurrency())))

    billingPeriods.each( \ billingPeriod -> {
      var aPolicy = policies.firstWhere( \ aPolicy -> aPolicy.LatestPeriod.PolicyNumber == billingPeriod.PolicyNumber && aPolicy.LatestPeriod.TermNumber != null)
      if(aPolicy != null){
        var invoices = _billingSummaryPlugin.retrievePolicyBillingSummary(aPolicy.LatestPeriod.PolicyNumber, aPolicy.LatestPeriod.TermNumber).Invoices
        invoices.each( \ anInvoice -> {
          totalBilled += anInvoice.Billed
          totalPastDue += anInvoice.PastDue
        })
      }
      dto.Unbilled.Amount += billingPeriod.UnbilledAmount.Amount
      dto.Unbilled.Currency = billingPeriod.UnbilledAmount.Currency
    })

    dto.CurrentDue = _currencyPlugin.toDTO(CurrencyPlatformUtil.toCurrencyAmount(totalBilled))
    dto.PastDue = _currencyPlugin.toDTO(CurrencyPlatformUtil.toCurrencyAmount(totalPastDue))
    dto.TotalDue = _currencyPlugin.toDTO(CurrencyPlatformUtil.toCurrencyAmount(totalBilled + totalPastDue))
  }
}
