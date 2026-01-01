package nz.co.acc.lob.aep.rating

uses entity.windowed.AEPAuditNegatedLevyCost_ACCVersionList
uses gw.financials.PolicyPeriodFXRateCache
uses gw.pl.persistence.core.effdate.EffDatedVersionList
uses typekey.Currency

class AEPAuditNegatedLevyCostData extends AEPCostData<AEPAuditNegatedLevyCost_ACC> {

  construct(effDate: Date, expDate: Date, c: Currency, rateCache: PolicyPeriodFXRateCache) {
    super(effDate, expDate, c, rateCache)
  }

  construct(effDate: Date, expDate: Date) {
    super(effDate, expDate)
  }

  construct(cost: AEPAuditNegatedLevyCost_ACC) {
    super(cost)
  }

  construct(cost: AEPAuditNegatedLevyCost_ACC, rateCache: PolicyPeriodFXRateCache) {
    super(cost, rateCache)
  }

  override function setSpecificFieldsOnCost(line: AEPLine_ACC, costEntity: AEPAuditNegatedLevyCost_ACC): void {
    super.setSpecificFieldsOnCost(line, costEntity)
  }

  override function getVersionedCosts(line: AEPLine_ACC): List<EffDatedVersionList> {
    return line.VersionList.AEPAuditNegatedLevyCosts.where(\costVL -> isCostVersionListForThisCostData(costVL))
  }

  private function isCostVersionListForThisCostData(costVL:AEPAuditNegatedLevyCost_ACCVersionList): boolean {
    var v1 = costVL.AllVersions.first()
    return ((v1 typeis AEPAuditNegatedLevyCost_ACC))
  }

  protected override property get KeyValues(): List<Object> {
    var result: List<Object> = {"AEPAuditNegatedLevyCost_ACC"}
    result.addAll(super.KeyValues)
    return result
  }
}