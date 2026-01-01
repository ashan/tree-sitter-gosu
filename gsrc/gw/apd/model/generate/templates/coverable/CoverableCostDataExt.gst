<%@ params(coverable : APDCoverable, coverableBasis : Set<APDCoverable>, exposureBasis : Set<APDExposure>) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}.${APDConstants.RATING}"
var extPackage = "${coverable.LOBPackageName}.${APDConstants.RATING}"

var isLine = coverable typeis APDProductLine

var methodSignatureArgs = {
      exposureBasis?.map(\exp -> "${exp.TypeName.uncapitalize()}Id : Key").join(", "),
      coverableBasis?.map(\cbl -> "${cbl.TypeName.uncapitalize()}Id : Key").join(", ")
  }
  .where(\s -> s != null && s.HasContent)
  .join(", ")
if (methodSignatureArgs.HasContent) {
  methodSignatureArgs = ", " + methodSignatureArgs
}
var methodCallArgs = {
      exposureBasis?.map(\exp -> "${exp.TypeName.uncapitalize()}Id").join(", "),
      coverableBasis?.map(\cbl -> "${cbl.TypeName.uncapitalize()}Id").join(", ")
  }
  .where(\s -> s != null && s.HasContent)
  .join(", ")
if (methodCallArgs.HasContent) {
  methodCallArgs = ", " + methodCallArgs
}
%>
package ${extPackage}

uses gw.financials.PolicyPeriodFXRateCache
uses ${basePackage}.${coverable.QualifiedName}CostDataBase
uses gw.pl.persistence.core.Key

@Export
class ${coverable.QualifiedName}CostData extends ${coverable.QualifiedName}CostDataBase {

  construct(effDate : Date, expDate : Date, currency : Currency, rateCache : PolicyPeriodFXRateCache, costCode : CostCode<%
    %><%if (not isLine) {%>, coverableId : Key<%}%><%
    %>${methodSignatureArgs}) {
    super(effDate, expDate, currency, rateCache, costCode<%if (not isLine) {%>, coverableId<%}%>${methodCallArgs})
  }

  construct(effDate : Date, expDate : Date, costCode : CostCode<%
    %><%if (not isLine) {%>, coverableId : Key<%}%><%
    %>${methodSignatureArgs}) {
    super(effDate, expDate, costCode<%if (not isLine) {%>, coverableId<%}%>${methodCallArgs})
  }

  construct(cost : ${coverable.QualifiedName}Cost) {
    super(cost)
  }

  construct(cost : ${coverable.QualifiedName}Cost, rateCache : PolicyPeriodFXRateCache) {
    super(cost, rateCache)
  }

}