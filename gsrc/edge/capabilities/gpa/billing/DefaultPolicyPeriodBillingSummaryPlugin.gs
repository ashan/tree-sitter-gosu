package edge.capabilities.gpa.billing

uses edge.PlatformSupport.CurrencyPlatformUtil
uses edge.capabilities.gpa.billing.dto.PolicyPeriodBillingSummaryDTO
uses edge.di.annotations.ForAllGwNodes
uses edge.capabilities.gpa.currency.local.ICurrencyPlugin
uses gw.api.webservice.exception.BadIdentifierException
uses gw.plugin.Plugins
uses gw.plugin.billing.BillingPeriodInfo
uses gw.plugin.billing.IBillingSummaryPlugin
uses edge.PlatformSupport.Logger
uses edge.PlatformSupport.Reflection
uses gw.plugin.billing.bc1000.BCPolicyBillingSummaryWrapper
uses gw.plugin.billing.bc1000.BCDisplayablePolicyPeriodWrapper
uses java.lang.Exception
uses java.util.ArrayList
uses edge.capabilities.gpa.billing.dto.BillingInvoiceDTO

class DefaultPolicyPeriodBillingSummaryPlugin implements IPolicyPeriodBillingSummaryPlugin {

  private static var LOGGER = new Logger(Reflection.getRelativeName(DefaultPolicyPeriodBillingSummaryPlugin))

  private var _currencyPlugin : ICurrencyPlugin
  private var _billingSummaryPlugin : IBillingSummaryPlugin
  private var _billingInvoicePlugin : IBillingInvoicePlugin

  @ForAllGwNodes
  construct(aCurrencyPlugin : ICurrencyPlugin, anInvoicePlugin : IBillingInvoicePlugin) {
    this._currencyPlugin = aCurrencyPlugin
    this._billingSummaryPlugin = Plugins.get(IBillingSummaryPlugin)
    this._billingInvoicePlugin = anInvoicePlugin
  }

  override function getAccountBilledOwnedPolicies(anAccount: Account): PolicyPeriodBillingSummaryDTO [] {

    try{
      final var summaries = _billingSummaryPlugin.retrieveBillingPolicies(anAccount.AccountNumber)
      return toDTOArray(getPoliciesInOrganization(summaries))
    } catch(e : BadIdentifierException) {
      if(LOGGER.debugEnabled()){
        LOGGER.logError(e)
      }else{
        LOGGER.logError(e.LocalizedMessage)
      }
    } catch(e: Exception) {
      LOGGER.logError(e)
    }

    return new PolicyPeriodBillingSummaryDTO[]{}
  }

  override function getAccountBilledUnownedPolicies(anAccount: Account): PolicyPeriodBillingSummaryDTO[] {
    try{
      final var summaries = _billingSummaryPlugin.getPoliciesBilledToAccount(anAccount.AccountNumber)
      return toDTOArray(getPoliciesInOrganization(summaries))
    } catch(e : BadIdentifierException) {
      if(LOGGER.debugEnabled()){
        LOGGER.logError(e)
      }else{
        LOGGER.logError(e.LocalizedMessage)
      }
    } catch(e: Exception) {
      LOGGER.logError(e)
    }

    return new PolicyPeriodBillingSummaryDTO[]{}
  }

  override function getPolicyPeriodBillingSummariesForPolicy(aPolicy: Policy): PolicyPeriodBillingSummaryDTO[] {
    final var period = aPolicy.LatestPeriod
    final var periodBillingSummary = getPolicyPeriodBillingInfo(period.PolicyNumber, period.TermNumber)

    if(periodBillingSummary.PolicyTermInfos.Count > 1){
      // Map the other policy period terms billing info excluding the latest period as we already have that data
      final var billingSummaries = periodBillingSummary.PolicyTermInfos.where( \ billingSummary -> billingSummary.TermNumber != periodBillingSummary.TermNumber)
                                                                       .map( \ termInfo -> getPolicyPeriodBillingInfo(termInfo.PolicyNumber, termInfo.TermNumber))

      final var allSummaries = billingSummaries.concat({periodBillingSummary})

      return toDTOArray(allSummaries)
    }

    return toDTOArray({periodBillingSummary})
  }

  override function getPolicyInvoicesForAccount(anAccount: Account): BillingInvoiceDTO[] {
    final var billingInvoices = new ArrayList<BillingInvoiceDTO>()
    anAccount.Policies.each( \ aPolicy -> {
      if(checkPolicyInOrganization(aPolicy) && aPolicy.LatestPeriod.TermNumber != null){
        final var periodBillingSummary = getPolicyPeriodBillingInfo(aPolicy.LatestPeriod.PolicyNumber, aPolicy.LatestPeriod.TermNumber)
        billingInvoices.addAll(_billingInvoicePlugin.toDTOArray(periodBillingSummary.Invoices).toList())
      }
    })

    return billingInvoices.toTypedArray()
  }

  public static function fillBaseProperties(dto : PolicyPeriodBillingSummaryDTO, aBillingPeriod : BillingPeriodInfo, aCurrencyPlugin : ICurrencyPlugin){
    dto.BilledAmount = aCurrencyPlugin.toDTO(CurrencyPlatformUtil.toCurrencyAmount(aBillingPeriod.TotalBilled))
    dto.PastDueAmount = aCurrencyPlugin.toDTO(CurrencyPlatformUtil.toCurrencyAmount(aBillingPeriod.PastDue))
    dto.UnbilledAmount = aCurrencyPlugin.toDTO(CurrencyPlatformUtil.toCurrencyAmount(aBillingPeriod.Unbilled))
    dto.AlternativeBillingAccount = aBillingPeriod.AltBillingAccount
    dto.IsDelinquent = aBillingPeriod.Delinquent
    dto.CanUserView = perm.PolicyPeriod.view(Policy.finder.findMostRecentBoundPeriodByPolicyNumber(aBillingPeriod.PolicyNumber))
  }

  protected function toDTO(aBillingPeriod: BillingPeriodInfo): PolicyPeriodBillingSummaryDTO {
    final var dto = new PolicyPeriodBillingSummaryDTO ()
    fillBaseProperties(dto, aBillingPeriod, _currencyPlugin)

    if(aBillingPeriod typeis BCDisplayablePolicyPeriodWrapper){
      dto.PolicyNumber = aBillingPeriod.PolicyNumber
      dto.ProductName = aBillingPeriod.Product
      dto.EffectiveDate = aBillingPeriod.EffectiveDate
      dto.ExpirationDate = aBillingPeriod.ExpirationDate
      dto.OwningAccount = aBillingPeriod.OwningAccount
    }else if(aBillingPeriod typeis BCPolicyBillingSummaryWrapper){
      dto.CurrentOutstandingAmount = _currencyPlugin.toDTO(CurrencyPlatformUtil.toCurrencyAmount(aBillingPeriod.CurrentOutstanding))
      dto.PaidAmount = _currencyPlugin.toDTO(CurrencyPlatformUtil.toCurrencyAmount(aBillingPeriod.Paid))
      dto.TotalCharges = _currencyPlugin.toDTO(CurrencyPlatformUtil.toCurrencyAmount(aBillingPeriod.TotalCharges))
      dto.BillingMethod = aBillingPeriod.BillingMethod
      dto.PaymentPlan = aBillingPeriod.PaymentPlanName
      dto.InvoiceStream = aBillingPeriod.InvoiceStream
      dto.Invoices = _billingInvoicePlugin.toDTOArray(aBillingPeriod.Invoices)
      dto.PeriodName = getDisplayablePeriodNameForBillingPeriod(aBillingPeriod)
    }

    return dto
  }

  protected function toDTOArray(billingPeriods: BillingPeriodInfo[]): PolicyPeriodBillingSummaryDTO [] {
    if(billingPeriods != null && billingPeriods.HasElements){
      return billingPeriods.map( \ aBillingPeriod -> toDTO(aBillingPeriod))
    }
    return new PolicyPeriodBillingSummaryDTO []{}
  }

  protected function getDisplayablePeriodNameForBillingPeriod(aBillingPeriod: BillingPeriodInfo): String {
    final var termInfo = aBillingPeriod.PolicyTermInfos.firstWhere(\term -> (term.TermNumber == aBillingPeriod.TermNumber && term.PolicyNumber == aBillingPeriod.PolicyNumber))
    if (termInfo != null){
      return termInfo.EffectiveDate.ShortFormat + " - " + termInfo.ExpirationDate.ShortFormat
    }

    return null
  }

  protected function getPolicyPeriodBillingInfo(policyNumber : String, termNumber : int) : BillingPeriodInfo{
    return _billingSummaryPlugin.retrievePolicyBillingSummary(policyNumber, termNumber)
  }

  /**
   * Check if the given billing period is part of the current user's organisation
   */
  protected function getPoliciesInOrganization(billingPeriods: BillingPeriodInfo[]): BillingPeriodInfo[] {
    final var periodInfos = new ArrayList<BillingPeriodInfo>()

    billingPeriods.each(\aBillingPeriod -> {
      var aPolicy = Policy.finder.findPolicyByPolicyNumber(aBillingPeriod.PolicyNumber)
      if (aPolicy != null){
        if (checkPolicyInOrganization(aPolicy)){
          periodInfos.add(aBillingPeriod)
        }
      }
    })

    return periodInfos.toTypedArray()
  }

  protected function checkPolicyInOrganization(aPolicy : Policy) : boolean{
    var org = User.util.CurrentUser.Organization
    var codes = gw.api.database.Query.make(ProducerCode).compare("Organization", Equals, org).select()

    return codes.hasMatch(\code -> aPolicy.ProducerCodeOfService == code || aPolicy.LatestPeriod.ProducerCodeOfRecord == code)
  }

}
