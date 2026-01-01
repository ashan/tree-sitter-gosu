<% uses gw.acc.npg.model.Cost %>
<% uses gw.acc.npg.model.ColumnType %>
<%@ params(cost:Cost) %>
  var _coverageID: Key

  construct(effDate: Date, expDate: Date, c: Currency, rateCache: PolicyPeriodFXRateCache, coverageID: Key) {
    super(effDate, expDate, c, rateCache)
    init(coverageID)
  }

  construct(effDate: Date, expDate: Date, coverageID: Key) {
    super(effDate, expDate)
    init(coverageID)
  }

  private function init(coverageID: Key) {
    assertKeyType(coverageID, ${cost.Coverage.EntityName})
    _coverageID = coverageID
  }

  construct(cost: ${cost.EntityName}) {
    super(cost)
    _coverageID = cost.${cost.CoverageFkField.Name}.FixedId
<%if(not SetterFromCostToCostData.renderToString(cost).Empty){%>
${SetterFromCostToCostData.renderToString(cost)}
<%}%>
  }

  construct(cost: ${cost.EntityName}, rateCache: PolicyPeriodFXRateCache) {
    super(cost, rateCache)
    _coverageID = cost.${cost.CoverageFkField.Name}.FixedId
<%if(not SetterFromCostToCostData.renderToString(cost).Empty){%>
${SetterFromCostToCostData.renderToString(cost)}
<%}%>
  }

  override function setSpecificFieldsOnCost(line: ${cost.LineEntityName}, costEntity: ${cost.EntityName}): void {
    super.setSpecificFieldsOnCost(line, costEntity)
    costEntity.setFieldValue("${cost.CoverageFkField.Name}", _coverageID)
<%if(not SetterFromCostDataToCost.renderToString(cost).Empty){%>
${SetterFromCostDataToCost.renderToString(cost)}
<%}%>
  }

  override function getVersionedCosts(line: ${cost.LineEntityName}): List<EffDatedVersionList> {
    // var coverageVL = EffDatedUtil.createVersionList(line.Branch, _coverageID) as ${cost.Coverage.VersionListName}
    // return coverageVL.${cost.ReferenceName}.where(\costVL -> isCostVersionListForThisCostData(costVL))
    // The above implementation is a guideline for sample usage. The logic will need to be reviewed + implemented.
    return new ArrayList<EffDatedVersionList>()
  }

  private function isCostVersionListForThisCostData(costVL: ${cost.VersionListName}): boolean {
    var v1 = costVL.AllVersions.first()
    return (true)${CostDataMatchingCriteria.renderToString(cost)}
    // If matching logic is more complex, you can add that here.
  }

  override function toString(): String {
    return "Coverage: \${_coverageID}"
  }

  protected override property get KeyValues(): List<Object> {<%
var commarSeperatedFields = CostDataExtraFieldsList.renderToString(cost)
if(commarSeperatedFields.trim().Empty){%>
    var result: List<Object> = {_coverageID}
<%}else{%>
    var result: List<Object> = {_coverageID, ${commarSeperatedFields}}
<%}%>
    result.addAll(super.KeyValues)
    return result
  }

