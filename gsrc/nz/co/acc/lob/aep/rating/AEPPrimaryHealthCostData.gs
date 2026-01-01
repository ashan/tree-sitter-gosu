package nz.co.acc.lob.aep.rating

uses entity.windowed.AEPAdministrationFeeCost_ACCVersionList
uses entity.windowed.AEPPrimaryHealthCost_ACCVersionList
uses gw.financials.PolicyPeriodFXRateCache
uses gw.pl.persistence.core.effdate.EffDatedVersionList
uses typekey.Currency

class AEPPrimaryHealthCostData extends AEPCostData<AEPPrimaryHealthCost_ACC> {

  construct(effDate: Date, expDate: Date, c: Currency, rateCache: PolicyPeriodFXRateCache) {
    super(effDate, expDate, c, rateCache)
  }

  construct(effDate: Date, expDate: Date) {
    super(effDate, expDate)
  }

  construct(cost: AEPPrimaryHealthCost_ACC) {
    super(cost)
  }

  construct(cost: AEPPrimaryHealthCost_ACC, rateCache: PolicyPeriodFXRateCache) {
    super(cost, rateCache)
  }

  override function setSpecificFieldsOnCost(line: AEPLine_ACC, costEntity: AEPPrimaryHealthCost_ACC): void {
    super.setSpecificFieldsOnCost(line, costEntity)
  }

  override function getVersionedCosts(line: AEPLine_ACC): List<EffDatedVersionList> {
    return line.VersionList.AEPPrimaryHealthCosts.where(\costVL -> isCostVersionListForThisCostData(costVL))
  }

  private function isCostVersionListForThisCostData(costVL: AEPPrimaryHealthCost_ACCVersionList): boolean {
    var v1 = costVL.AllVersions.first()
    return ((v1 typeis AEPPrimaryHealthCost_ACC))
  }

  protected override property get KeyValues(): List<Object> {
    var result: List<Object> = {"AEPPrimaryHealthCostData"}
    result.addAll(super.KeyValues)
    return result
  }


}