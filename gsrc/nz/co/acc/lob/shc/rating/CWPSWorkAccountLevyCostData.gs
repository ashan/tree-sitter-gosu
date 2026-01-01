package nz.co.acc.lob.shc.rating

uses entity.windowed.CWPSCovVersionList
uses entity.windowed.CWPSWorkAccountLevyCostVersionList
uses gw.api.effdate.EffDatedUtil
uses gw.financials.PolicyPeriodFXRateCache
uses gw.pl.persistence.core.Key
uses gw.pl.persistence.core.effdate.EffDatedVersionList
uses nz.co.acc.lob.ind.rating.INDCostData
uses productmodel.CWPSLine
uses typekey.Currency

class CWPSWorkAccountLevyCostData extends SHCCostData<CWPSWorkAccountLevyCost> {

  var _costItemID : Key
  var _coveredItemID: Key

  construct(effDate: Date, expDate: Date, c: Currency, rateCache: PolicyPeriodFXRateCache, coveredItemID: Key, costItemID:Key) {
    super(effDate, expDate, c, rateCache)
    init(coveredItemID, costItemID)
  }

  construct(effDate: Date, expDate: Date, coveredItemID: Key, costItemID:Key) {
    super(effDate, expDate)
    init(coveredItemID, costItemID)
  }

  private function init(coveredItemID: Key, costItemID:Key) {
    assertKeyType(coveredItemID, CWPSCov)
    _coveredItemID = coveredItemID
    _costItemID = costItemID
  }

  construct(cost: CWPSWorkAccountLevyCost) {
    super(cost)
    _coveredItemID = cost.CWPSCov.FixedId
    _costItemID = cost.CWPSWorkAccountLevyCostItem.FixedId
  }

  construct(cost: CWPSWorkAccountLevyCost, rateCache: PolicyPeriodFXRateCache) {
    super(cost, rateCache)
    _coveredItemID = cost.CWPSCov.FixedId
    _costItemID = cost.CWPSWorkAccountLevyCostItem.FixedId
  }

  override function setSpecificFieldsOnCost(line: CWPSLine, costEntity: CWPSWorkAccountLevyCost): void {
    super.setSpecificFieldsOnCost(line, costEntity)
    costEntity.setFieldValue("CWPSCov", _coveredItemID)
    costEntity.setFieldValue("CWPSWorkAccountLevyCostItem", _costItemID)
  }

  override function getVersionedCosts(line: CWPSLine): List<EffDatedVersionList> {
    var coveredItemVL = EffDatedUtil.createVersionList(line.Branch, _coveredItemID) as CWPSCovVersionList
    return coveredItemVL.CWPSWorkAccountLevyCosts.where(\costVL -> isCostVersionListForThisCostData(costVL))
  }

  private function isCostVersionListForThisCostData(costVL: CWPSWorkAccountLevyCostVersionList): boolean {
    var v1 = costVL.AllVersions.first()
    var isCost = v1 typeis CWPSWorkAccountLevyCost and v1.CWPSWorkAccountLevyCostItem.FixedId == _costItemID
    return isCost
  }

  override function toString(): String {
    return "Covered Item: ${_coveredItemID}, ${_costItemID}"
  }

  protected override property get KeyValues(): List<Object> {
    var result: List<Object> = {_coveredItemID, _costItemID}
    result.addAll(super.KeyValues)
    return result
  }

}