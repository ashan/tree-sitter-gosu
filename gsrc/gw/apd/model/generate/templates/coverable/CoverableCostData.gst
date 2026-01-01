<%
uses gw.apd.model.generate.templates.TemplateComparators
%>
<%@ params(coverable : APDCoverable, coverableBasis : Set<APDCoverable>, exposureBasis : Set<APDExposure>) %>
<%
uses gw.apd.APDConstants

var sortedCblBasis = coverableBasis.toTypedArray().sort(TemplateComparators.CoverableOrdering)
var sortedExpBasis = exposureBasis.toTypedArray().sort(TemplateComparators.ExposureOrdering)

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}.${APDConstants.RATING}"

var isLine = coverable typeis APDProductLine
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
<%if (not isLine) {%>
uses gw.api.effdate.EffDatedUtil
uses gw.pl.persistence.core.Key
<%}%>
uses gw.pl.persistence.core.effdate.EffDatedVersionList
<%if (not isLine) {%>
uses entity.windowed.${coverable.QualifiedName}VersionList
uses entity.windowed.${coverable.QualifiedName}CostVersionList
<%} else {%>
uses entity.windowed.${coverable.LinePrefix}CostVersionList
<%}%>

@Export
class ${coverable.QualifiedName}CostDataBase extends ${coverable.LinePrefix}CostData<${coverable.QualifiedName}Cost> {

<%if (not isLine) {%>
  var _coverableId : Key
<%}%>
<%for (exp in sortedExpBasis) {%>
  var _${exp.TypeName.uncapitalize()}Id : Key
<%}%>
<%for (cbl in sortedCblBasis) {%>
  var _${cbl.TypeName.uncapitalize()}Id : Key
<%}%>

  construct(effDate : Date, expDate : Date, currency : Currency, rateCache : PolicyPeriodFXRateCache, costCode : CostCode<%
    %><%if (not isLine) {%>, coverableId : Key<%}%><%
    %>${methodSignatureArgs}) {
    super(effDate, expDate, currency, rateCache, costCode)
<%if (not isLine) {%>
    init(coverableId${methodCallArgs})
<%}%>
  }

  construct(effDate : Date, expDate : Date, costCode : CostCode<%
    %><%if (not isLine) {%>, coverableId : Key<%}%><%
    %>${methodSignatureArgs}) {
    super(effDate, expDate, costCode)
<%if (not isLine) {%>
    init(coverableId${methodCallArgs})
<%}%>
  }

  construct(cost : ${coverable.QualifiedName}Cost) {
    super(cost)
<%if (not isLine) {%>
    init(cost)
<%}%>
  }

  construct(cost : ${coverable.QualifiedName}Cost, rateCache : PolicyPeriodFXRateCache) {
    super(cost, rateCache)
<%if (not isLine) {%>
    init(cost)
<%}%>
  }

<%if (not isLine) {%>
  private function init(coverableId : Key${methodSignatureArgs}) {
    assertKeyType(coverableId, ${coverable.QualifiedName})
    _coverableId = coverableId
<%for (exp in sortedExpBasis) {%>
    assertKeyType(${exp.TypeName.uncapitalize()}Id, ${exp.QualifiedName})
    _${exp.TypeName.uncapitalize()}Id = ${exp.TypeName.uncapitalize()}Id
<%}%>
<%for (cbl in sortedCblBasis) {%>
    assertKeyType(${cbl.TypeName.uncapitalize()}Id, ${cbl.QualifiedName})
    _${cbl.TypeName.uncapitalize()}Id = ${cbl.TypeName.uncapitalize()}Id
<%}%>
  }

  private function init(cost : ${coverable.QualifiedName}Cost) {
<%if (not isLine) {%>
    _coverableId = cost.${coverable.QualifiedName}.FixedId
<%}%>
<%for (exp in sortedExpBasis) {%>
    _${exp.TypeName.uncapitalize()}Id = cost.${exp.QualifiedName}.FixedId
<%}%>
<%for (cbl in sortedCblBasis) {%>
    _${cbl.TypeName.uncapitalize()}Id = cost.${cbl.QualifiedName}.FixedId
<%}%>
  }

<%} // end of 'if not line' %>
  override function setSpecificFieldsOnCost(line : entity.${lineQualifiedName}, cost : ${coverable.QualifiedName}Cost) {
    super.setSpecificFieldsOnCost(line, cost)
<%if (not isLine) {%>
    cost.setFieldValue(entity.${coverable.QualifiedName}Cost#${coverable.QualifiedName}.PropertyInfo.Name, _coverableId)
<%}%>
<%for (exp in sortedExpBasis) {%>
    cost.setFieldValue(entity.${coverable.QualifiedName}Cost#${exp.QualifiedName}.PropertyInfo.Name, _${exp.TypeName.uncapitalize()}Id)
<%}%>
<%for (cbl in sortedCblBasis) {%>
    cost.setFieldValue(entity.${coverable.QualifiedName}Cost#${cbl.QualifiedName}.PropertyInfo.Name, _${cbl.TypeName.uncapitalize()}Id)
<%}%>
  }

  override function getVersionedCosts(line : entity.${lineQualifiedName}) : List<EffDatedVersionList> {
<%if (isLine) {%>
    return line.VersionList.${coverable.QualifiedName}Costs.where(\costVL -> isCostVersionListForThisCostData(costVL))
<%} else {%>
    var coverableLV = EffDatedUtil.createVersionList(line.Branch, _coverableId) as ${coverable.QualifiedName}VersionList
    return coverableLV.${coverable.QualifiedName}Costs.where(\costVL -> isCostVersionListForThisCostData(costVL))
<%}%>
  }

  private function isCostVersionListForThisCostData(costVL : ${coverable.LinePrefix}<%if (not isLine) {%>${coverable.TypeName}<%}%>CostVersionList) : boolean {
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
<%if (isLine) {%>
        and v1 typeis ${coverable.QualifiedName}Cost
<%} else {%>
        and v1.${coverable.QualifiedName}.FixedId == _coverableId
<%}%>
<%for (exp in sortedExpBasis) {%>
        and v1.${exp.QualifiedName}.FixedId == _${exp.TypeName.uncapitalize()}Id
<%}%>
<%for (cbl in sortedCblBasis) {%>
        and v1.${cbl.QualifiedName}.FixedId == _${cbl.TypeName.uncapitalize()}Id
<%}%>
  }

  override function toString() : String {
    return "${coverable.QualifiedName}:<%if (not isLine) {%>\${_coverableId}<%}%>"
<%for (exp in sortedExpBasis) {%>
        + "\${_${exp.TypeName.uncapitalize()}Id}"
<%}%>
<%for (cbl in sortedCblBasis) {%>
        + "\${_${cbl.TypeName.uncapitalize()}Id}"
<%}%>
  }

  protected override property get KeyValues() : List<Object> {
<%if (isLine) {%>
    return super.KeyValues
<%} else {%>
    var result : List<Object> = {
        _coverableId
<%for (exp in sortedExpBasis) {%>
        , _${exp.TypeName.uncapitalize()}Id
<%}%>
<%for (cbl in sortedCblBasis) {%>
        , _${cbl.TypeName.uncapitalize()}Id
<%}%>
    }
    result.addAll(super.KeyValues)
    return result
<%}%>
  }

}