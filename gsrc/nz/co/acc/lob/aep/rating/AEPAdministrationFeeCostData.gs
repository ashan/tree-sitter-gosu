package nz.co.acc.lob.aep.rating

uses entity.windowed.AEPAdministrationFeeCost_ACCVersionList
uses gw.financials.PolicyPeriodFXRateCache
uses gw.pl.persistence.core.effdate.EffDatedVersionList

class AEPAdministrationFeeCostData extends AEPCostData<AEPAdministrationFeeCost_ACC> {

  construct(effDate: Date, expDate: Date, c: Currency, rateCache: PolicyPeriodFXRateCache) {
    super(effDate, expDate, c, rateCache)
  }

  construct(effDate: Date, expDate: Date) {
    super(effDate, expDate)
  }

  construct(cost: AEPAdministrationFeeCost_ACC) {
    super(cost)
  }

  construct(cost: AEPAdministrationFeeCost_ACC, rateCache: PolicyPeriodFXRateCache) {
    super(cost, rateCache)
  }

  override function setSpecificFieldsOnCost(line: AEPLine_ACC, costEntity: AEPAdministrationFeeCost_ACC): void {
    super.setSpecificFieldsOnCost(line, costEntity)
  }

  override function getVersionedCosts(line: AEPLine_ACC): List<EffDatedVersionList> {
    return line.VersionList.AEPAdministrationFeeCosts.where(\costVL -> isCostVersionListForThisCostData(costVL))
  }

  private function isCostVersionListForThisCostData(costVL: AEPAdministrationFeeCost_ACCVersionList): boolean {
    var v1 = costVL.AllVersions.first()
    return ((v1 typeis AEPAdministrationFeeCost_ACC))
  }

  protected override property get KeyValues(): List<Object> {
    var result: List<Object> = {"AEPAdministrationFeeCostData"}
    result.addAll(super.KeyValues)
    return result
  }


}