package nz.co.acc.lob.emp

uses gw.policy.PolicyLineConfiguration
uses gw.plugin.rateflow.IRateRoutineConfig
uses nz.co.acc.lob.emp.rating.EMPRateRoutineConfig
uses gw.api.productmodel.PolicyLinePatternLookup

class EMPConfiguration extends PolicyLineConfiguration{

  override property get RateRoutineConfig() : IRateRoutineConfig {
    return new EMPRateRoutineConfig()
  }

  override property get AllowedCurrencies() : List<Currency>  {
    var pattern = PolicyLinePatternLookup.getByCodeIdentifier(InstalledPolicyLine.TC_EMP.UnlocalizedName)
    return pattern.AvailableCurrenciesByPriority
  }

}