package nz.co.acc.lob.shc.rating

uses gw.financials.PolicyPeriodFXRateCache
uses gw.api.effdate.EffDatedUtil
uses gw.pl.persistence.core.effdate.EffDatedVersionList
uses entity.windowed.CWPSCovVersionList
uses entity.windowed.CWPSLiableCostVersionList

uses java.util.Date

uses gw.pl.persistence.core.Key

class CWPSLiableCostData extends SHCCostData<CWPSLiableCost> {

  var _coveredItemID: Key

  construct(effDate: Date, expDate: Date, c: Currency, rateCache: PolicyPeriodFXRateCache, coveredItemID: Key) {
    super(effDate, expDate, c, rateCache)
    init(coveredItemID)
  }

  construct(effDate: Date, expDate: Date, coveredItemID: Key) {
    super(effDate, expDate)
    init(coveredItemID)
  }

  private function init(coveredItemID: Key) {
    assertKeyType(coveredItemID, CWPSCov)
    _coveredItemID = coveredItemID
  }

  construct(cost: CWPSLiableCost) {
    super(cost)
    _coveredItemID = cost.CWPSCov.FixedId
  }

  construct(cost: CWPSLiableCost, rateCache: PolicyPeriodFXRateCache) {
    super(cost, rateCache)
    _coveredItemID = cost.CWPSCov.FixedId
  }

  override function setSpecificFieldsOnCost(line: CWPSLine, costEntity: CWPSLiableCost): void {
    super.setSpecificFieldsOnCost(line, costEntity)
    costEntity.setFieldValue("CWPSCov", _coveredItemID)
  }

  override function getVersionedCosts(line: CWPSLine): List<EffDatedVersionList> {
    var coveredItemVL = EffDatedUtil.createVersionList(line.Branch, _coveredItemID) as CWPSCovVersionList
    return coveredItemVL.CWPSCosts.where(\costVL -> isCostVersionListForThisCostData(costVL))
  }

  private function isCostVersionListForThisCostData(costVL: CWPSLiableCostVersionList): boolean {
    var v1 = costVL.AllVersions.first()
    return (true)
    // If matching logic is more complex, you can add that here.
  }

  override function toString(): String {
    return "Covered Item: ${_coveredItemID}"
  }

  protected override property get KeyValues(): List<Object> {
    var result: List<Object> = {_coveredItemID}
    result.addAll(super.KeyValues)
    return result
  }

}