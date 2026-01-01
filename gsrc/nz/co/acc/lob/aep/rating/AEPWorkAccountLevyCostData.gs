package nz.co.acc.lob.aep.rating

uses entity.windowed.AEPWorkAccountLevyCost_ACCVersionList
uses gw.financials.PolicyPeriodFXRateCache
uses gw.pl.persistence.core.effdate.EffDatedVersionList
uses gw.pl.persistence.core.Key
uses typekey.Currency

class AEPWorkAccountLevyCostData extends AEPCostData<AEPWorkAccountLevyCost_ACC> {
  var _cuItemID:Key

  construct(effDate: Date, expDate: Date, c: Currency, rateCache: PolicyPeriodFXRateCache, cuItemID:Key) {
    super(effDate, expDate, c, rateCache)
    _cuItemID = cuItemID
  }

  construct(effDate: Date, expDate: Date, cuItemID:Key) {
    super(effDate, expDate)
    _cuItemID = cuItemID
  }

  construct(cost: AEPWorkAccountLevyCost_ACC) {
    super(cost)
    _cuItemID = cost.AEPRateableCUData.FixedId
  }

  construct(cost: AEPWorkAccountLevyCost_ACC, rateCache: PolicyPeriodFXRateCache) {
    super(cost, rateCache)
    _cuItemID = cost.AEPRateableCUData.FixedId
  }

  override function setSpecificFieldsOnCost(line: AEPLine_ACC, costEntity: AEPWorkAccountLevyCost_ACC): void {
    super.setSpecificFieldsOnCost(line, costEntity)
    costEntity.setFieldValue("AEPRateableCUData", _cuItemID)
  }

  override function getVersionedCosts(line: AEPLine_ACC): List<EffDatedVersionList> {
    return line.VersionList.AEPWorkAccountLevyCosts.where(\costVL -> isCostVersionListForThisCostData(costVL))
  }

  private function isCostVersionListForThisCostData(costVL: AEPWorkAccountLevyCost_ACCVersionList): boolean {
    var v1 = costVL.AllVersions.first()
    return (v1 typeis AEPWorkAccountLevyCost_ACC) and v1.AEPRateableCUData.FixedId == _cuItemID
  }

  override function toString(): String {
    return "Covered Item: ${_cuItemID}"
  }

  property get CUItemFixedID() : Key {
    return _cuItemID
  }

  protected override property get KeyValues(): List<Object> {
    var result: List<Object> = {_cuItemID}
    result.addAll(super.KeyValues)
    return result
  }

}