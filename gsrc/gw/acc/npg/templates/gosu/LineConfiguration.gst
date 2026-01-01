<% uses gw.acc.npg.model.ProductLine %>
<%@ params(productLine: ProductLine) %>
package ${productLine.LOBPackageName}

uses gw.policy.PolicyLineConfiguration
uses gw.plugin.rateflow.IRateRoutineConfig
uses ${productLine.LOBPackageName}.rating.${productLine.RateRoutineConfigName}
uses gw.api.productmodel.PolicyLinePatternLookup

class ${productLine.LineConfigurationName} extends PolicyLineConfiguration{

  override property get RateRoutineConfig() : IRateRoutineConfig {
    return new ${productLine.RateRoutineConfigName}()
  }

  override property get AllowedCurrencies() : List<Currency>  {
    var pattern = PolicyLinePatternLookup.getByCodeIdentifier(InstalledPolicyLine.${productLine.LineTypeKey}.UnlocalizedName)
    return pattern.AvailableCurrenciesByPriority
  }

}
