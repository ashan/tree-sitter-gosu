<% uses gw.acc.npg.model.Cost %>
<%@ params(cost:Cost) %>
  construct(effDate: Date, expDate: Date, c: Currency, rateCache: PolicyPeriodFXRateCache) {
    super(effDate, expDate, c, rateCache)
  }

  construct(effDate: Date, expDate: Date) {
    super(effDate, expDate)
  }

  construct(cost: ${cost.EntityName}) {
    super(cost)
<%if(not SetterFromCostToCostData.renderToString(cost).Empty){%>
${SetterFromCostToCostData.renderToString(cost)}
<%}%>
  }

  construct(cost: ${cost.EntityName}, rateCache: PolicyPeriodFXRateCache) {
    super(cost, rateCache)
<%if(not SetterFromCostToCostData.renderToString(cost).Empty){%>
${SetterFromCostToCostData.renderToString(cost)}
<%}%>
  }

  override function setSpecificFieldsOnCost(line: ${cost.LineEntityName}, costEntity: ${cost.EntityName}): void {
    super.setSpecificFieldsOnCost(line, costEntity)
<%if(not SetterFromCostDataToCost.renderToString(cost).Empty){%>
${SetterFromCostDataToCost.renderToString(cost)}
<%}%>
  }

  override function getVersionedCosts(line: ${cost.LineEntityName}): List<EffDatedVersionList> {
    return line.VersionList.${cost.ReferenceName}.where(\costVL -> isCostVersionListForThisCostData(costVL))
  }

  private function isCostVersionListForThisCostData(costVL: ${cost.VersionListName}): boolean {
    var v1 = costVL.AllVersions.first()
    return ((v1 typeis ${cost.EntityName}))${CostDataMatchingCriteria.renderToString(cost)}
  }

  protected override property get KeyValues(): List<Object> {
    var result: List<Object> = {${CostDataExtraFieldsList.renderToString(cost).trim()}}
    result.addAll(super.KeyValues)
    return result
  }