<%@ params(productLine : APDProductLine) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${productLine.LinePrefixLowerCase}"
var extPackage = "${productLine.LOBPackageName}.${APDConstants.RATING}"
%>
package ${basePackage}

uses ${extPackage}.${productLine.LinePrefix}RateRoutineConfig
uses gw.api.productmodel.PolicyLinePatternLookup
uses gw.plugin.rateflow.IRateRoutineConfig
uses gw.policy.PolicyLineConfiguration

@Export
class ${productLine.LinePrefix}Configuration extends PolicyLineConfiguration {

  override property get RateRoutineConfig() : IRateRoutineConfig {
    return new ${productLine.LinePrefix}RateRoutineConfig()
  }

  override property get AllowedCurrencies() : List<Currency>  {
    var pattern = PolicyLinePatternLookup.getByCodeIdentifier(InstalledPolicyLine.TC_${productLine.LinePrefix}.UnlocalizedName)
    return pattern.AvailableCurrenciesByPriority
  }

}