package nz.co.acc.lob.cpx

uses gw.policy.PolicyLineConfiguration
uses gw.plugin.rateflow.IRateRoutineConfig
uses nz.co.acc.lob.cpx.rating.CPXRateRoutineConfig
uses gw.api.productmodel.PolicyLinePatternLookup

class CPXConfiguration extends PolicyLineConfiguration{

  override property get RateRoutineConfig() : IRateRoutineConfig {
    return new CPXRateRoutineConfig()
  }

  override property get AllowedCurrencies() : List<Currency>  {
    var pattern = PolicyLinePatternLookup.getByCodeIdentifier(InstalledPolicyLine.TC_CPX.UnlocalizedName)
    return pattern.AvailableCurrenciesByPriority
  }

}