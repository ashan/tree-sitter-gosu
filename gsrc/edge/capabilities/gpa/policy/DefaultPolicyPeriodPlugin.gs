package edge.capabilities.gpa.policy

uses edge.PlatformSupport.CurrencyPlatformUtil
uses edge.capabilities.gpa.policy.dto.PolicyPeriodDTO
uses edge.capabilities.gpa.currency.local.ICurrencyPlugin
uses edge.di.annotations.ForAllGwNodes

class DefaultPolicyPeriodPlugin implements IPolicyPeriodPlugin {

  private var _policyLinePlugin : IPolicyLinePlugin
  private var _currencyPlugin : ICurrencyPlugin

  @ForAllGwNodes
  @Param("aPolicyLinePlugin", "Plugin used to handle policyline conversion")
  construct(aPolicyLinePlugin : IPolicyLinePlugin, aCurrencyPlugin : ICurrencyPlugin){
    _policyLinePlugin = aPolicyLinePlugin
    _currencyPlugin = aCurrencyPlugin
  }

  override function toDTO(aPolicyPeriod: PolicyPeriod): PolicyPeriodDTO {
    final var dto = new PolicyPeriodDTO()
    fillBaseProperties(dto, aPolicyPeriod)
    dto.TotalPremium = _currencyPlugin.toDTO(CurrencyPlatformUtil.toCurrencyAmount(aPolicyPeriod.TotalPremiumRPT))
    dto.PolicyLines = _policyLinePlugin.getPolicyLines(aPolicyPeriod)
    dto.canChange = perm.PolicyPeriod.change(aPolicyPeriod) and aPolicyPeriod.Policy.Issued
    dto.canCancel = perm.PolicyPeriod.cancel(aPolicyPeriod)
    dto.canRenew = aPolicyPeriod.CanRenewPolicy
    dto.TotalCost = _currencyPlugin.toDTO(CurrencyPlatformUtil.toCurrencyAmount(aPolicyPeriod.TotalCostRPT))
    dto.TaxesAndFees = (aPolicyPeriod.TotalCostRPT != null && aPolicyPeriod.TotalPremiumRPT != null) ? _currencyPlugin.toDTO(CurrencyPlatformUtil.toCurrencyAmount(aPolicyPeriod.TotalCostRPT - aPolicyPeriod.TotalPremiumRPT)) : null
    dto.CreatedByMe = aPolicyPeriod.CreateUser == User.util.CurrentUser
    dto.PrimaryInsuredName = aPolicyPeriod.PrimaryInsuredName
    dto.Canceled = aPolicyPeriod.Canceled

    return dto
  }

  override function toDTOArray(policyPeriods: PolicyPeriod[]): PolicyPeriodDTO[] {
    if(policyPeriods != null && policyPeriods.HasElements){
      return policyPeriods.map( \ pp -> toDTO(pp))
    }

    return null
  }

  public static function fillBaseProperties(dto : PolicyPeriodDTO, aPolicyPeriod : PolicyPeriod){
    dto.PublicID = aPolicyPeriod.PublicID
    dto.PolicyNumber = aPolicyPeriod.PolicyNumber
    dto.EffectiveDate = aPolicyPeriod.PeriodStart
    dto.ExpirationDate = aPolicyPeriod.EndOfCoverageDate
    dto.ProducerCodeOfRecord = aPolicyPeriod.ProducerCodeOfRecord.Code
    dto.ProducerCodeOfRecordOrg = aPolicyPeriod.ProducerCodeOfRecord.Organization.Name
    dto.ProducerCodeOfService = aPolicyPeriod.EffectiveDatedFields.ProducerCode.Code
    dto.ProducerCodeOfServiceOrg = aPolicyPeriod.EffectiveDatedFields.ProducerCode.Organization.Name
    dto.Status = aPolicyPeriod.Status.DisplayName
    dto.DisplayStatus = aPolicyPeriod.PeriodDisplayStatus
  }
}
