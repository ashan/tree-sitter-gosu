package nz.co.acc.lob.aep.rating

uses entity.windowed.AEPPartnershipPlanDiscountCost_ACCVersionList
uses gw.financials.PolicyPeriodFXRateCache
uses gw.pl.persistence.core.Key
uses gw.pl.persistence.core.effdate.EffDatedVersionList

class AEPPartnershipPlanDiscountCostData extends AEPCostData<AEPPartnershipPlanDiscountCost_ACC> {
  var _cuItemID:Key

  construct(effDate: Date, expDate: Date, c: Currency, rateCache: PolicyPeriodFXRateCache, cuItemID:Key) {
    super(effDate, expDate, c, rateCache)
    _cuItemID = cuItemID
  }

  construct(effDate: Date, expDate: Date, cuItemID:Key) {
    super(effDate, expDate)
    _cuItemID = cuItemID
  }

  construct(cost: AEPPartnershipPlanDiscountCost_ACC) {
    super(cost)
    _cuItemID = cost.AEPRateableCUData.FixedId
  }

  construct(cost: AEPPartnershipPlanDiscountCost_ACC, rateCache: PolicyPeriodFXRateCache) {
    super(cost, rateCache)
  }

  override function setSpecificFieldsOnCost(line: AEPLine_ACC, costEntity: AEPPartnershipPlanDiscountCost_ACC): void {
    super.setSpecificFieldsOnCost(line, costEntity)
    costEntity.setFieldValue("AEPRateableCUData", _cuItemID)
  }

  override function getVersionedCosts(line: AEPLine_ACC): List<EffDatedVersionList> {
    return line.VersionList.AEPPartnershipPlanDiscountCosts.where(\costVL -> isCostVersionListForThisCostData(costVL))
  }

  private function isCostVersionListForThisCostData(costVL: AEPPartnershipPlanDiscountCost_ACCVersionList): boolean {
    var v1 = costVL.AllVersions.first()
    return ((v1 typeis AEPPartnershipPlanDiscountCost_ACC) and v1.AEPRateableCUData.FixedId == _cuItemID)
  }

  override function toString(): String {
    return "Covered Item: ${_cuItemID}"
  }

  protected override property get KeyValues(): List<Object> {
    var result: List<Object> = {_cuItemID}
    result.addAll(super.KeyValues)
    return result
  }
}