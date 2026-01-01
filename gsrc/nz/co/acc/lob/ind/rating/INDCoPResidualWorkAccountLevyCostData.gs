package nz.co.acc.lob.ind.rating

uses entity.windowed.INDCoPCovVersionList
uses entity.windowed.INDCoPResidualWorkAccountLevyCostVersionList
uses entity.windowed.INDCoPWorkAccountLevyCostVersionList
uses gw.api.effdate.EffDatedUtil
uses gw.financials.PolicyPeriodFXRateCache
uses gw.pl.persistence.core.Key
uses gw.pl.persistence.core.effdate.EffDatedVersionList
uses productmodel.INDCoPLine
uses typekey.Currency

class INDCoPResidualWorkAccountLevyCostData extends INDCostData<INDCoPResidualWorkAccountLevyCost> {

  var _workAccountLevyCostItemID : Key
  var _coveredItemID: Key

  construct(effDate: Date, expDate: Date, c: Currency, rateCache: PolicyPeriodFXRateCache, coveredItemID: Key, workAccountLevyCostItemID: Key) {
    super(effDate, expDate, c, rateCache)
    init(coveredItemID, workAccountLevyCostItemID)
  }

  construct(effDate: Date, expDate: Date, coveredItemID: Key, workAccountLevyCostItemID: Key) {
    super(effDate, expDate)
    init(coveredItemID, workAccountLevyCostItemID)
  }

  private function init(coveredItemID: Key, workAccountLevyCostItemID: Key) {
    assertKeyType(coveredItemID, INDCoPCov)
    _coveredItemID = coveredItemID
    _workAccountLevyCostItemID = workAccountLevyCostItemID
  }

  construct(cost: INDCoPResidualWorkAccountLevyCost) {
    super(cost)
    _coveredItemID = cost.INDCoPCov.FixedId
    _workAccountLevyCostItemID = cost.ResWorkAccountLevyCostItem.FixedId
  }

  construct(cost: INDCoPResidualWorkAccountLevyCost, rateCache: PolicyPeriodFXRateCache) {
    super(cost, rateCache)
    _coveredItemID = cost.INDCoPCov.FixedId
    _workAccountLevyCostItemID = cost.ResWorkAccountLevyCostItem.FixedId
  }

  override function setSpecificFieldsOnCost(line: INDCoPLine, costEntity: INDCoPResidualWorkAccountLevyCost): void {
    super.setSpecificFieldsOnCost(line, costEntity)
    costEntity.setFieldValue("INDCoPCov", _coveredItemID)
    costEntity.setFieldValue("ResWorkAccountLevyCostItem", _workAccountLevyCostItemID)
  }

  override function getVersionedCosts(line: INDCoPLine): List<EffDatedVersionList> {
    var coveredItemVL = EffDatedUtil.createVersionList(line.Branch, _coveredItemID) as INDCoPCovVersionList
    return coveredItemVL.INDCoPResidualWorkAccountLevyCosts.where(\costVL -> isCostVersionListForThisCostData(costVL))
  }

  private function isCostVersionListForThisCostData(costVL: INDCoPResidualWorkAccountLevyCostVersionList): boolean {
    var versionList = costVL.AllVersions.first()
    var isCost = versionList typeis INDCoPResidualWorkAccountLevyCost and versionList.ResWorkAccountLevyCostItem.FixedId == _workAccountLevyCostItemID
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