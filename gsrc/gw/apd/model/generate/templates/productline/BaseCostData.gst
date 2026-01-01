<%@ params(productLine : APDProductLine) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${productLine.LinePrefixLowerCase}.${APDConstants.RATING}"
%>
package ${basePackage}

uses gw.financials.PolicyPeriodFXRateCache
uses gw.rating.CostDataWithOverrideSupport

uses java.util.Date

@Export
abstract class ${productLine.LinePrefix}CostData<R extends ${productLine.LinePrefix}Cost> extends CostDataWithOverrideSupport<R, entity.${productLine.QualifiedName}> {

  construct(effDate : Date, expDate : Date, costCode : CostCode) {
    super(effDate, expDate, costCode)
  }

  construct(effDate : Date, expDate : Date, currency : Currency, rateCache : PolicyPeriodFXRateCache, costCode : CostCode) {
    super(effDate, expDate, currency, rateCache, costCode)
  }

  construct(cost : R) {
    super(cost)
  }

  construct(cost : R, rateCache : PolicyPeriodFXRateCache) {
    super(cost, rateCache)
  }

  override function setSpecificFieldsOnCost(line : entity.${productLine.LinePrefix}${productLine.TypeName}, cost : R) {
    cost.setFieldValue(R#${productLine.LinePrefix}${productLine.TypeName}.PropertyInfo.Name, line.FixedId)
  }

  protected override property get KeyValues() : List<Object> {
    return {}  // Return an empty list
  }

}