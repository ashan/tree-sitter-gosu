package nz.co.acc.lob.aep.rating

uses entity.windowed.AEPStopLossLevyCost_ACCVersionList
uses gw.financials.PolicyPeriodFXRateCache
uses gw.pl.persistence.core.effdate.EffDatedVersionList

class AEPStopLossLevyCostData extends AEPCostData<AEPStopLossLevyCost_ACC> {

  construct(effDate: Date, expDate: Date, c: Currency, rateCache: PolicyPeriodFXRateCache) {
    super(effDate, expDate, c, rateCache)
  }

  construct(effDate: Date, expDate: Date) {
    super(effDate, expDate)
  }

  construct(cost: AEPStopLossLevyCost_ACC) {
    super(cost)
  }

  construct(cost: AEPStopLossLevyCost_ACC, rateCache: PolicyPeriodFXRateCache) {
    super(cost, rateCache)
  }

  override function setSpecificFieldsOnCost(line: AEPLine_ACC, costEntity: AEPStopLossLevyCost_ACC): void {
    super.setSpecificFieldsOnCost(line, costEntity)
  }

  override function getVersionedCosts(line: AEPLine_ACC): List<EffDatedVersionList> {
    return line.VersionList.AEPStopLossLevyCosts.where(\costVL -> isCostVersionListForThisCostData(costVL))
  }

  private function isCostVersionListForThisCostData(costVL: AEPStopLossLevyCost_ACCVersionList): boolean {
    var v1 = costVL.AllVersions.first()
    return ((v1 typeis AEPStopLossLevyCost_ACC))
  }

  protected override property get KeyValues(): List<Object> {
    var result: List<Object> = {"AEPStopLossLevyCostData"}
    result.addAll(super.KeyValues)
    return result
  }

}