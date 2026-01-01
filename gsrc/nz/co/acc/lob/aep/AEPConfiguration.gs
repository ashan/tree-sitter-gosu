package nz.co.acc.lob.aep

uses gw.policy.PolicyLineConfiguration
uses gw.plugin.rateflow.IRateRoutineConfig
uses nz.co.acc.lob.aep.rating.AEPRateRoutineConfig
uses gw.api.productmodel.PolicyLinePatternLookup

class AEPConfiguration extends PolicyLineConfiguration{

  override property get RateRoutineConfig() : IRateRoutineConfig {
    return new AEPRateRoutineConfig()
  }

  override property get AllowedCurrencies() : List<Currency>  {
    var pattern = PolicyLinePatternLookup.getByCodeIdentifier(InstalledPolicyLine.TC_AEP.UnlocalizedName)
    return pattern.AvailableCurrenciesByPriority
  }

}