package nz.co.acc.lob.shc

uses gw.policy.PolicyLineConfiguration
uses gw.plugin.rateflow.IRateRoutineConfig
uses nz.co.acc.lob.shc.rating.SHCRateRoutineConfig
uses gw.api.productmodel.PolicyLinePatternLookup

class SHCConfiguration extends PolicyLineConfiguration{

  override property get RateRoutineConfig() : IRateRoutineConfig {
    return new SHCRateRoutineConfig()
  }

  override property get AllowedCurrencies() : List<Currency>  {
    var pattern = PolicyLinePatternLookup.getByCodeIdentifier(InstalledPolicyLine.TC_SHC.UnlocalizedName)
    return pattern.AvailableCurrenciesByPriority
  }

}