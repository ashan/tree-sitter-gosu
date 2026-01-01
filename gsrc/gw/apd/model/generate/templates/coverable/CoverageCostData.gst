<%
uses gw.apd.model.generate.templates.TemplateComparators
%>
<%@ params(coverable : APDCoverable, coverableBasis : Set<APDCoverable>, exposureBasis : Set<APDExposure>) %>
<%
uses gw.apd.APDConstants

var sortedCblBasis = coverableBasis.toTypedArray().sort(TemplateComparators.CoverableOrdering)
var sortedExpBasis = exposureBasis.toTypedArray().sort(TemplateComparators.ExposureOrdering)

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}.${APDConstants.RATING}"

var lineQualifiedName = coverable.ProductLine.LinePrefix + coverable.ProductLine.TypeName

var methodSignatureArgs = {
      sortedExpBasis?.map(\exp -> "${exp.TypeName.uncapitalize()}Id : Key").join(", "),
      sortedCblBasis?.map(\cbl -> "${cbl.TypeName.uncapitalize()}Id : Key").join(", ")
  }
  .where(\s -> s != null && s.HasContent)
  .join(", ")
if (methodSignatureArgs.HasContent) {
  methodSignatureArgs = ", " + methodSignatureArgs
}
var methodCallArgs = {
      sortedExpBasis?.map(\exp -> "${exp.TypeName.uncapitalize()}Id").join(", "),
      sortedCblBasis?.map(\cbl -> "${cbl.TypeName.uncapitalize()}Id").join(", ")
  }
  .where(\s -> s != null && s.HasContent)
  .join(", ")
if (methodCallArgs.HasContent) {
  methodCallArgs = ", " + methodCallArgs
}
%>
package ${basePackage}

uses gw.financials.PolicyPeriodFXRateCache
uses gw.api.effdate.EffDatedUtil
uses gw.pl.persistence.core.Key
uses gw.pl.persistence.core.effdate.EffDatedVersionList
uses entity.windowed.${coverable.QualifiedName}CovVersionList
uses entity.windowed.${coverable.QualifiedName}CovCostVersionList

@Export
class ${coverable.QualifiedName}CovCostDataBase extends ${coverable.LinePrefix}CostData<${coverable.QualifiedName}CovCost> {

  var _coverageId : Key
<%for (exp in sortedExpBasis) {%>
  var _${exp.TypeName.uncapitalize()}Id : Key
<%}%>
<%for (cbl in sortedCblBasis) {%>
  var _${cbl.TypeName.uncapitalize()}Id : Key
<%}%>

  construct(effDate : Date, expDate : Date, currency : Currency, rateCache : PolicyPeriodFXRateCache, costCode : CostCode, coverageId : Key${methodSignatureArgs}) {
    super(effDate, expDate, currency, rateCache, costCode)
    init(coverageId${methodCallArgs})
  }

  construct(effDate : Date, expDate : Date, costCode : CostCode, coverageId : Key${methodSignatureArgs}) {
    super(effDate, expDate, costCode)
    init(coverageId${methodCallArgs})
  }

  construct(cost : ${coverable.QualifiedName}CovCost) {
    super(cost)
    init(cost)
  }

  construct(cost : ${coverable.QualifiedName}CovCost, rateCache : PolicyPeriodFXRateCache) {
    super(cost, rateCache)
    init(cost)
  }

  private function init(coverageId : Key${methodSignatureArgs}) {
    assertKeyType(coverageId, ${coverable.QualifiedName}Cov)
    _coverageId = coverageId
<%for (exp in sortedExpBasis) {%>
    assertKeyType(${exp.TypeName.uncapitalize()}Id, ${exp.QualifiedName})
    _${exp.TypeName.uncapitalize()}Id = ${exp.TypeName.uncapitalize()}Id
<%}%>
<%for (cbl in sortedCblBasis) {%>
    assertKeyType(${cbl.TypeName.uncapitalize()}Id, ${cbl.QualifiedName})
    _${cbl.TypeName.uncapitalize()}Id = ${cbl.TypeName.uncapitalize()}Id
<%}%>
  }

  private function init(cost : ${coverable.QualifiedName}CovCost) {
    _coverageId = cost.${coverable.QualifiedName}Cov.FixedId
<%for (exp in sortedExpBasis) {%>
    _${exp.TypeName.uncapitalize()}Id = cost.${exp.QualifiedName}.FixedId
<%}%>
<%for (cbl in sortedCblBasis) {%>
    _${cbl.TypeName.uncapitalize()}Id = cost.${cbl.QualifiedName}.FixedId
<%}%>
  }

  override function setSpecificFieldsOnCost(line : entity.${lineQualifiedName}, cost : ${coverable.QualifiedName}CovCost) {
    super.setSpecificFieldsOnCost(line, cost)
    cost.setFieldValue(entity.${coverable.QualifiedName}CovCost#${coverable.QualifiedName}Cov.PropertyInfo.Name, _coverageId)
<%for (exp in sortedExpBasis) {%>
    cost.setFieldValue(entity.${coverable.QualifiedName}CovCost#${exp.QualifiedName}.PropertyInfo.Name, _${exp.TypeName.uncapitalize()}Id)
<%}%>
<%for (cbl in sortedCblBasis) {%>
    cost.setFieldValue(entity.${coverable.QualifiedName}CovCost#${cbl.QualifiedName}.PropertyInfo.Name, _${cbl.TypeName.uncapitalize()}Id)
<%}%>
  }

  override function getVersionedCosts(line : entity.${lineQualifiedName}) : List<EffDatedVersionList> {
    var coverageLV = EffDatedUtil.createVersionList(line.Branch, _coverageId) as ${coverable.QualifiedName}CovVersionList
    return coverageLV.Costs.where(\costVL -> isCostVersionListForThisCostData(costVL))
  }

  private function isCostVersionListForThisCostData(costVL : ${coverable.QualifiedName}CovCostVersionList) : boolean {
    var v1 = costVL.AllVersions.first()
    return
        // standard keys
            v1.CoverageCurrency == this.Currency
        and v1.ChargePattern == this.ChargePattern
        and v1.ChargeGroup == this.ChargeGroup
        and v1.RateAmountType == this.RateAmountType
        and v1.BillGroup == this.BillGroup
        and v1.CostCode == this.CostCode
        // keys for this cost
        and v1.${coverable.QualifiedName}Cov.FixedId == _coverageId
<%for (exp in sortedExpBasis) {%>
        and v1.${exp.QualifiedName}.FixedId == _${exp.TypeName.uncapitalize()}Id
<%}%>
<%for (cbl in sortedCblBasis) {%>
        and v1.${cbl.QualifiedName}.FixedId == _${cbl.TypeName.uncapitalize()}Id
<%}%>
  }

  override function toString() : String {
    return "${coverable.QualifiedName}Cov:\${_coverageId}"
<%for (exp in sortedExpBasis) {%>
        + "\${_${exp.TypeName.uncapitalize()}Id}"
<%}%>
<%for (cbl in sortedCblBasis) {%>
        + "\${_${cbl.TypeName.uncapitalize()}Id}"
<%}%>
  }

  protected override property get KeyValues() : List<Object> {
    var result : List<Object> = {
        _coverageId
<%for (exp in sortedExpBasis) {%>
        , _${exp.TypeName.uncapitalize()}Id
<%}%>
<%for (cbl in sortedCblBasis) {%>
        , _${cbl.TypeName.uncapitalize()}Id
<%}%>
    }
    result.addAll(super.KeyValues)
    return result
  }

}