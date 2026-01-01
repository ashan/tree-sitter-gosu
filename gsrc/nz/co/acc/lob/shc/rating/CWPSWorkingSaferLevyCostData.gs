package nz.co.acc.lob.shc.rating

uses entity.windowed.CWPSCovVersionList
uses entity.windowed.CWPSWorkingSaferLevyCostVersionList
uses gw.api.effdate.EffDatedUtil
uses gw.financials.PolicyPeriodFXRateCache
uses gw.pl.persistence.core.Key
uses gw.pl.persistence.core.effdate.EffDatedVersionList
uses nz.co.acc.lob.ind.rating.INDCostData
uses productmodel.CWPSLine
uses typekey.Currency

class CWPSWorkingSaferLevyCostData extends SHCCostData<CWPSWorkingSaferLevyCost> {

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

  construct(cost: CWPSWorkingSaferLevyCost) {
    super(cost)
    _coveredItemID = cost.CWPSCov.FixedId
  }

  construct(cost: CWPSWorkingSaferLevyCost, rateCache: PolicyPeriodFXRateCache) {
    super(cost, rateCache)
    _coveredItemID = cost.CWPSCov.FixedId
  }

  override function setSpecificFieldsOnCost(line: CWPSLine, costEntity: CWPSWorkingSaferLevyCost): void {
    super.setSpecificFieldsOnCost(line, costEntity)
    costEntity.setFieldValue("CWPSCov", _coveredItemID)
  }

  override function getVersionedCosts(line: CWPSLine): List<EffDatedVersionList> {
    var coveredItemVL = EffDatedUtil.createVersionList(line.Branch, _coveredItemID) as CWPSCovVersionList
    return coveredItemVL.CWPSWorkingSaferLevyCosts.where(\costVL -> isCostVersionListForThisCostData(costVL))
  }

  private function isCostVersionListForThisCostData(costVL: CWPSWorkingSaferLevyCostVersionList): boolean {
    var v1 = costVL.AllVersions.first()
    return (true)
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