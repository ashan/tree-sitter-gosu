package nz.co.acc.lob.aep.rating

uses entity.windowed.AEPResidualWorkAccountLevyCost_ACCVersionList
uses gw.financials.PolicyPeriodFXRateCache
uses gw.pl.persistence.core.Key
uses gw.pl.persistence.core.effdate.EffDatedVersionList

class AEPResidualWorkAccountLevyCostData extends AEPCostData<AEPResidualWorkAccountLevyCost_ACC> {
  var _cuItemID:Key

  construct(effDate: Date, expDate: Date, c: Currency, rateCache: PolicyPeriodFXRateCache, cuItemID:Key) {
    super(effDate, expDate, c, rateCache)
    _cuItemID = cuItemID
  }

  construct(effDate: Date, expDate: Date, cuItemID:Key) {
    super(effDate, expDate)
    _cuItemID = cuItemID
  }

  construct(cost: AEPResidualWorkAccountLevyCost_ACC) {
    super(cost)
    _cuItemID = cost.AEPRateableCUData.FixedId
  }

  construct(cost: AEPResidualWorkAccountLevyCost_ACC, rateCache: PolicyPeriodFXRateCache) {
    super(cost, rateCache)
    _cuItemID = cost.AEPRateableCUData.FixedId
  }

  override function setSpecificFieldsOnCost(line: AEPLine_ACC, costEntity: AEPResidualWorkAccountLevyCost_ACC): void {
    super.setSpecificFieldsOnCost(line, costEntity)
    costEntity.setFieldValue("AEPRateableCUData", _cuItemID)
  }

  override function getVersionedCosts(line: AEPLine_ACC): List<EffDatedVersionList> {
    return line.VersionList.AEPResidualWorkAccountLevyCosts.where(\costVL -> isCostVersionListForThisCostData(costVL))
  }

  private function isCostVersionListForThisCostData(costVL: AEPResidualWorkAccountLevyCost_ACCVersionList): boolean {
    var v1 = costVL.AllVersions.first()
    return (v1 typeis AEPResidualWorkAccountLevyCost_ACC) and v1.AEPRateableCUData.FixedId == _cuItemID
  }

  protected override property get KeyValues(): List<Object> {
    var result: List<Object> = {"AEPResidualWorkAccountLevyCostData"}
    result.addAll(super.KeyValues)
    return result
  }
}