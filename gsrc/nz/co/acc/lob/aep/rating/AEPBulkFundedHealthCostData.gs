package nz.co.acc.lob.aep.rating

uses entity.windowed.AEPBulkFundedHealthCost_ACCVersionList
uses gw.financials.PolicyPeriodFXRateCache
uses gw.pl.persistence.core.effdate.EffDatedVersionList

class AEPBulkFundedHealthCostData extends AEPCostData<AEPBulkFundedHealthCost_ACC> {

  construct(effDate: Date, expDate: Date, c: Currency, rateCache: PolicyPeriodFXRateCache) {
    super(effDate, expDate, c, rateCache)
  }

  construct(effDate: Date, expDate: Date) {
    super(effDate, expDate)
  }

  construct(cost: AEPBulkFundedHealthCost_ACC) {
    super(cost)
  }

  construct(cost: AEPBulkFundedHealthCost_ACC, rateCache: PolicyPeriodFXRateCache) {
    super(cost, rateCache)
  }

  override function setSpecificFieldsOnCost(line: AEPLine_ACC, costEntity: AEPBulkFundedHealthCost_ACC): void {
    super.setSpecificFieldsOnCost(line, costEntity)
  }

  override function getVersionedCosts(line: AEPLine_ACC): List<EffDatedVersionList> {
    return line.VersionList.AEPBulkFundedHealthCosts.where(\costVL -> isCostVersionListForThisCostData(costVL))
  }

  private function isCostVersionListForThisCostData(costVL: AEPBulkFundedHealthCost_ACCVersionList): boolean {
    var v1 = costVL.AllVersions.first()
    return ((v1 typeis AEPBulkFundedHealthCost_ACC))
  }

  protected override property get KeyValues(): List<Object> {
    var result: List<Object> = {"AEPBulkFundedHealthCostData"}
    result.addAll(super.KeyValues)
    return result
  }

}