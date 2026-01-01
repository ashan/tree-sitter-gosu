package nz.co.acc.lob.ind.rating

uses entity.windowed.INDCoPCovVersionList
uses entity.windowed.INDCoPLiableEarningsCostVersionList
uses entity.windowed.INDCoPWorkAccountLevyCostVersionList
uses gw.api.effdate.EffDatedUtil
uses gw.financials.PolicyPeriodFXRateCache
uses gw.pl.persistence.core.Key
uses gw.pl.persistence.core.effdate.EffDatedVersionList
uses typekey.Currency
uses productmodel.INDCoPLine

class INDCoPWorkAccountLevyCostData extends INDCostData<INDCoPWorkAccountLevyCost> {

  var _workAccountLevyCostItemID : Key
  var _coveredItemID: Key

  construct(effDate: Date, expDate: Date, c: Currency, rateCache: PolicyPeriodFXRateCache, coveredItemID: Key, workAccountLevyCostItemID: Key) {
    super(effDate, expDate, c, rateCache)
    init(coveredItemID, workAccountLevyCostItemID)
  }

  construct(effDate: Date, expDate: Date, coveredItemID: Key, workAccountLevyCostItemID : Key) {
    super(effDate, expDate)
    init(coveredItemID, workAccountLevyCostItemID)
  }

  private function init(coveredItemID: Key, workAccountLevyCostItemID: Key) {
    assertKeyType(coveredItemID, entity.INDCoPCov)
    assertKeyType(workAccountLevyCostItemID, INDCoPWorkAccountLevyCostItem)
    _coveredItemID = coveredItemID
    _workAccountLevyCostItemID = workAccountLevyCostItemID
  }

  construct(cost: INDCoPWorkAccountLevyCost) {
    super(cost)
    _coveredItemID = cost.INDCoPCov.FixedId
    _workAccountLevyCostItemID = cost.WorkAccountLevyCostItem.FixedId
  }

  construct(cost: INDCoPWorkAccountLevyCost, rateCache: PolicyPeriodFXRateCache) {
    super(cost, rateCache)
    _coveredItemID = cost.INDCoPCov.FixedId
    _workAccountLevyCostItemID = cost.WorkAccountLevyCostItem.FixedId
  }

  override function setSpecificFieldsOnCost(line: INDCoPLine, costEntity: INDCoPWorkAccountLevyCost): void {
    super.setSpecificFieldsOnCost(line, costEntity)
    costEntity.setFieldValue("INDCoPCov", _coveredItemID)
    costEntity.setFieldValue("WorkAccountLevyCostItem", _workAccountLevyCostItemID)
  }

  override function getVersionedCosts(line: INDCoPLine): List<EffDatedVersionList> {
    var coveredItemVL = EffDatedUtil.createVersionList(line.Branch, _coveredItemID) as INDCoPCovVersionList
    return coveredItemVL.INDCoPWorkAccountLevyCosts.where(\costVL -> isCostVersionListForThisCostData(costVL))
  }

  private function isCostVersionListForThisCostData(costVL: INDCoPWorkAccountLevyCostVersionList): boolean {
    var versionList = costVL.AllVersions.first()
    var isCost = versionList typeis INDCoPWorkAccountLevyCost and versionList.WorkAccountLevyCostItem.FixedId == _workAccountLevyCostItemID
    return isCost
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