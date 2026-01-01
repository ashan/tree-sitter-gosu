package nz.co.acc.lob.cpx.rating

uses entity.windowed.CPXInfoCov_ACCVersionList
uses entity.windowed.INDCPXWorkAccountLevyCostVersionList
uses gw.api.effdate.EffDatedUtil
uses gw.financials.PolicyPeriodFXRateCache
uses gw.pl.persistence.core.Key
uses gw.pl.persistence.core.effdate.EffDatedVersionList
uses productmodel.INDCPXLine
uses typekey.Currency

class INDCPXWorkAccountLevyCostData extends CPXCostData<INDCPXWorkAccountLevyCost> {

  var _workAccountLevyCostItemID : Key
  var _coveredItemID: Key
  var _earningsItemID: Key

  construct(effDate: Date, expDate: Date, c: Currency, rateCache: PolicyPeriodFXRateCache, coveredItemID: Key, earningsItemID: Key, workAccountLevyCostItemID:Key) {
    super(effDate, expDate, c, rateCache)
    init(coveredItemID, earningsItemID, workAccountLevyCostItemID)
  }

  construct(effDate: Date, expDate: Date, coveredItemID: Key, earningsItemID:Key,workAccountLevyCostItemID:Key) {
    super(effDate, expDate)
    init(coveredItemID, earningsItemID, workAccountLevyCostItemID)
  }

  private function init(coveredItemID: Key, earningsItemID:Key, workAccountLevyCostItemID:Key) {
    assertKeyType(coveredItemID, INDCPXCov)
    assertKeyType(earningsItemID, CPXInfoCov_ACC)
    assertKeyType(workAccountLevyCostItemID, INDCPXWorkAccountLevyCostItem)
    _coveredItemID = coveredItemID
    _earningsItemID = earningsItemID
    _workAccountLevyCostItemID = workAccountLevyCostItemID
  }

  construct(cost: INDCPXWorkAccountLevyCost) {
    super(cost)
    _coveredItemID = cost.INDCPXCov.FixedId
    _earningsItemID = cost.CPXInfoCov.FixedId
    _workAccountLevyCostItemID = cost.WorkAccountLevyCostItem.FixedId
  }

  construct(cost: INDCPXWorkAccountLevyCost, rateCache: PolicyPeriodFXRateCache) {
    super(cost, rateCache)
    _coveredItemID = cost.INDCPXCov.FixedId
    _earningsItemID = cost.CPXInfoCov.FixedId
    _workAccountLevyCostItemID = cost.WorkAccountLevyCostItem.FixedId
  }

  override function setSpecificFieldsOnCost(line: INDCPXLine, costEntity: INDCPXWorkAccountLevyCost): void {
    super.setSpecificFieldsOnCost(line, costEntity)
    costEntity.setFieldValue("INDCPXCov", _coveredItemID)
    costEntity.setFieldValue("CPXInfoCov", _earningsItemID)
    costEntity.setFieldValue("WorkAccountLevyCostItem", _workAccountLevyCostItemID)
  }

  override function getVersionedCosts(line: INDCPXLine): List<EffDatedVersionList> {
    var coveredItemVL = EffDatedUtil.createVersionList(line.Branch, _earningsItemID) as CPXInfoCov_ACCVersionList
    return coveredItemVL.INDCPXWorkAccountLevyCosts.where(\costVL -> isCostVersionListForThisCostData(costVL))
  }

  private function isCostVersionListForThisCostData(costVL: INDCPXWorkAccountLevyCostVersionList): boolean {
    var v1 = costVL.AllVersions.first()
    return (true)
  }

  override function toString(): String {
    return "Covered Item: ${_coveredItemID}, ${_earningsItemID}"
  }

  protected override property get KeyValues(): List<Object> {
    var result: List<Object> = {_coveredItemID, _earningsItemID}
    result.addAll(super.KeyValues)
    return result
  }

}