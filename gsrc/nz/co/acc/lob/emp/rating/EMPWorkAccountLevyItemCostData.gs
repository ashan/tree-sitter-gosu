package nz.co.acc.lob.emp.rating

uses entity.windowed.EMPWPCCovVersionList
uses entity.windowed.EMPWPCLineVersionList
uses entity.windowed.EMPWorkAccountLevyItemCostVersionList
uses gw.api.effdate.EffDatedUtil
uses gw.financials.PolicyPeriodFXRateCache
uses gw.pl.persistence.core.Key
uses typekey.Currency

class EMPWorkAccountLevyItemCostData extends EMPCostData<EMPWorkAccountLevyItemCost> {

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
    assertKeyType(coveredItemID, entity.EMPWPCCov)
    assertKeyType(workAccountLevyCostItemID, EMPWorkAccountLevyCostItem)
    _coveredItemID = coveredItemID
    _workAccountLevyCostItemID = workAccountLevyCostItemID
  }

  construct(cost: EMPWorkAccountLevyItemCost) {
    super(cost)
    _coveredItemID = cost.EMPWPCCov.FixedId
    _workAccountLevyCostItemID = cost.EMPWorkAccountLevyCostItem.FixedId
  }

  construct(cost: EMPWorkAccountLevyItemCost, rateCache: PolicyPeriodFXRateCache) {
    super(cost, rateCache)
    _coveredItemID = cost.EMPWPCCov.FixedId
    _workAccountLevyCostItemID = cost.EMPWorkAccountLevyCostItem.FixedId
  }

  override function setSpecificFieldsOnCost(line: EMPWPCLine, costEntity: EMPWorkAccountLevyItemCost): void {
    super.setSpecificFieldsOnCost(line, costEntity)
    costEntity.setFieldValue("EMPWorkAccountLevyCostItem", _workAccountLevyCostItemID)
    costEntity.setFieldValue("EMPWPCCov", _coveredItemID)
  }

  override function getVersionedCosts(line: EMPWPCLine): List<gw.pl.persistence.core.effdate.EffDatedVersionList> {
    var coveredItemVL = EffDatedUtil.createVersionList(line.Branch, _coveredItemID) as EMPWPCCovVersionList
    var costList = coveredItemVL.EMPWorkAccountLevyItemCosts.where(\costVL -> isCostVersionListForThisCostData(costVL)).toList()
    return costList
  }

  private function isCostVersionListForThisCostData(costVL: EMPWorkAccountLevyItemCostVersionList): boolean {
    var first = costVL.AllVersions.first()
    var isCost = first typeis EMPWorkAccountLevyItemCost and first.EMPWorkAccountLevyCostItem.FixedId == _workAccountLevyCostItemID
    return isCost
  }

  override function toString(): String {
    return "Covered Item: ${_workAccountLevyCostItemID}, ${_coveredItemID}"
  }

  protected override property get KeyValues(): List<Object> {
    return {_workAccountLevyCostItemID, _coveredItemID}
  }
}