<% uses gw.acc.npg.model.Cost %>
<% uses gw.acc.npg.model.ColumnType %>
<%@ params(cost:Cost) %>
  var _coverageID : Key
  var _coveredItemID: Key

  construct(effDate : Date, expDate : Date, c : Currency, rateCache : PolicyPeriodFXRateCache, coverageID : Key, coveredItemID : Key) {
    super(effDate, expDate, c, rateCache)
    init(coverageID, coveredItemID)
  }

  construct(effDate : Date, expDate : Date, coverageID : Key, coveredItemID : Key) {
      super(effDate, expDate)
      init(coverageID, coveredItemID)
  }

  private function init(coverageID: Key, coveredItemID: Key) {
    assertKeyType(coverageID, ${cost.CoverageEntityName})
    _coveredItemID = coveredItemID
    assertKeyType(coveredItemID, ${cost.CoverableEntityName})
    _coverageID = coverageID
  }

  construct(cost: ${cost.EntityName}) {
    super(cost)
    _coverageID = cost.${cost.CoverageFkField.Name}.FixedId
    _coveredItemID = cost.${cost.CoverableFkField.Name}.FixedId
<%if(not SetterFromCostToCostData.renderToString(cost).Empty){%>
${SetterFromCostToCostData.renderToString(cost)}
<%}%>
  }

  construct(cost: ${cost.EntityName}, rateCache: PolicyPeriodFXRateCache) {
    super(cost, rateCache)
    _coverageID = cost.${cost.CoverageFkField.Name}.FixedId
    _coveredItemID = cost.${cost.CoverableFkField.Name}.FixedId
<%if(not SetterFromCostToCostData.renderToString(cost).Empty){%>
${SetterFromCostToCostData.renderToString(cost)}
<%}%>
  }

  override function setSpecificFieldsOnCost(line: ${cost.LineEntityName}, costEntity: ${cost.EntityName}): void {
    super.setSpecificFieldsOnCost(line, costEntity)
    costEntity.setFieldValue("${cost.CoverageFkField.Name}", _coverageID)
    costEntity.setFieldValue("${cost.CoverableFkField.Name}", _coveredItemID)
<%if(not SetterFromCostDataToCost.renderToString(cost).Empty){%>
${SetterFromCostDataToCost.renderToString(cost)}
<%}%>
  }

  override function getVersionedCosts(line: ${cost.LineEntityName}): List<EffDatedVersionList> {
    var coveredItemVL = EffDatedUtil.createVersionList(line.Branch, _coveredItemID) as ${cost.Coverable.VersionListName}
    return coveredItemVL.${cost.ReferenceName}.where(\costVL -> isCostVersionListForThisCostData(costVL))
  }

  private function isCostVersionListForThisCostData(costVL: ${cost.VersionListName}): boolean {
    var v1 = costVL.AllVersions.first()
    return (true)${CostDataMatchingCriteria.renderToString(cost)}
    // If matching logic is more complex, you can add that here.
  }

  override function toString(): String {
    return "Coverage: \${_coverageID} Covered Item: \${_coveredItemID} "
  }

  protected override property get KeyValues(): List<Object> {<%
var commarSeperatedFields = CostDataExtraFieldsList.renderToString(cost)
if(commarSeperatedFields.trim().Empty){%>
    var result: List<Object> = {_coveredItemID}
<%}else{%>
    var result: List<Object> = {_coveredItemID, ${commarSeperatedFields}}
<%}%>
    result.addAll(super.KeyValues)
    return result
  }
