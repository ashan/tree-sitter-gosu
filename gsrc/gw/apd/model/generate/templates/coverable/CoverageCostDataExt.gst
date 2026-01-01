<%@ params(coverable : APDCoverable, coverableBasis : Set<APDCoverable>, exposureBasis : Set<APDExposure>) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}.${APDConstants.RATING}"
var extPackage = "${coverable.LOBPackageName}.${APDConstants.RATING}"

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
uses ${basePackage}.${coverable.QualifiedName}CovCostDataBase
uses gw.pl.persistence.core.Key

@Export
class ${coverable.QualifiedName}CovCostData extends ${coverable.QualifiedName}CovCostDataBase {

  construct(effDate : Date, expDate : Date, currency : Currency, rateCache : PolicyPeriodFXRateCache, costCode : CostCode, coverageId : Key${methodSignatureArgs}) {
    super(effDate, expDate, currency, rateCache, costCode, coverageId${methodCallArgs})
  }

  construct(effDate : Date, expDate : Date, costCode : CostCode, coverageId : Key${methodSignatureArgs}) {
    super(effDate, expDate, costCode, coverageId${methodCallArgs})
  }

  construct(cost : ${coverable.QualifiedName}CovCost) {
    super(cost)
  }

  construct(cost : ${coverable.QualifiedName}CovCost, rateCache : PolicyPeriodFXRateCache) {
    super(cost, rateCache)
  }

}