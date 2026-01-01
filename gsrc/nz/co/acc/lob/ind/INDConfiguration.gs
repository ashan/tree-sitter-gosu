package nz.co.acc.lob.ind

uses gw.policy.PolicyLineConfiguration
uses gw.plugin.rateflow.IRateRoutineConfig
uses nz.co.acc.lob.ind.rating.INDRateRoutineConfig
uses gw.api.productmodel.PolicyLinePatternLookup

class INDConfiguration extends PolicyLineConfiguration{

  override property get RateRoutineConfig() : IRateRoutineConfig {
    return new INDRateRoutineConfig()
  }

  override property get AllowedCurrencies() : List<Currency>  {
    var pattern = PolicyLinePatternLookup.getByCodeIdentifier(InstalledPolicyLine.TC_IND.UnlocalizedName)
    return pattern.AvailableCurrenciesByPriority
  }

}