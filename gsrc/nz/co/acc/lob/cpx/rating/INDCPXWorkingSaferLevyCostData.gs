package nz.co.acc.lob.cpx.rating

uses entity.windowed.CPXInfoCov_ACCVersionList
uses entity.windowed.INDCPXEarnersLevyCostVersionList
uses entity.windowed.INDCPXWorkingSaferLevyCostVersionList
uses gw.api.effdate.EffDatedUtil
uses gw.financials.PolicyPeriodFXRateCache
uses gw.pl.persistence.core.Key
uses gw.pl.persistence.core.effdate.EffDatedVersionList
uses productmodel.INDCPXLine
uses typekey.Currency

class INDCPXWorkingSaferLevyCostData extends CPXCostData<INDCPXWorkingSaferLevyCost> {

  var _cpxEarningsItemID: Key
  var _coverableItemID : Key

  construct(effDate: Date, expDate: Date, c: Currency, rateCache: PolicyPeriodFXRateCache, coverableItemID:Key, cpxEarningsItemID: Key) {
    super(effDate, expDate, c, rateCache)
    init(coverableItemID, cpxEarningsItemID)
  }

  construct(effDate: Date, expDate: Date, coverableItemID:Key, cpxEarningsItemID: Key) {
    super(effDate, expDate)
    init(coverableItemID, cpxEarningsItemID)
  }

  private function init(coverableItemID:Key, cpxEarningsItemID: Key) {
    assertKeyType(coverableItemID, INDCPXCov)
    assertKeyType(cpxEarningsItemID, CPXInfoCov_ACC)
    _cpxEarningsItemID = cpxEarningsItemID
    _coverableItemID = coverableItemID
  }

  construct(cost: INDCPXWorkingSaferLevyCost) {
    super(cost)
    _cpxEarningsItemID = cost.CPXInfoCov.FixedId
    _coverableItemID = cost.INDCPXCov.FixedId
  }

  construct(cost: INDCPXWorkingSaferLevyCost, rateCache: PolicyPeriodFXRateCache) {
    super(cost, rateCache)
    _cpxEarningsItemID = cost.CPXInfoCov.FixedId
    _coverableItemID = cost.INDCPXCov.FixedId
  }

  override function setSpecificFieldsOnCost(line: INDCPXLine, costEntity: INDCPXWorkingSaferLevyCost): void {
    super.setSpecificFieldsOnCost(line, costEntity)
    costEntity.setFieldValue("CPXInfoCov", _cpxEarningsItemID)
    costEntity.setFieldValue("INDCPXCov", _coverableItemID)
  }

  override function getVersionedCosts(line: INDCPXLine): List<EffDatedVersionList> {
    var coveredItemVL = EffDatedUtil.createVersionList(line.Branch, _cpxEarningsItemID) as CPXInfoCov_ACCVersionList
    return coveredItemVL.INDCPXWorkingSaferLevyCosts.where(\costVL -> isCostVersionListForThisCostData(costVL))
  }

  private function isCostVersionListForThisCostData(costVL: INDCPXWorkingSaferLevyCostVersionList): boolean {
    var v1 = costVL.AllVersions.first()
    return (true)
  }

  override function toString(): String {
    return "Covered Item: ${_coverableItemID}, ${_cpxEarningsItemID}"
  }

  protected override property get KeyValues(): List<Object> {
    var result: List<Object> = {_coverableItemID, _cpxEarningsItemID}
    result.addAll(super.KeyValues)
    return result
  }

}