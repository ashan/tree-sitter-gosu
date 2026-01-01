package gw.lob.apd

uses gw.apd.rating.APDRateRoutineConfig
uses gw.api.productmodel.PolicyLinePatternLookup
uses gw.plugin.rateflow.IRateRoutineConfig
uses gw.policy.PolicyLineConfiguration

@Export
class APDConfiguration extends PolicyLineConfiguration {
  override property get RateRoutineConfig(): IRateRoutineConfig {
    return new APDRateRoutineConfig()
  }

  override property get AllowedCurrencies(): List<Currency> {
    var pattern = PolicyLinePatternLookup.getByPublicID(InstalledPolicyLine.TC_APD.UnlocalizedName)
    return pattern.AvailableCurrenciesByPriority
  }
}