package nz.co.acc.lob.emp.rating

uses entity.windowed.EMPWPCCovVersionList
uses entity.windowed.EMPWorkAccountLevyCostVersionList
uses gw.api.effdate.EffDatedUtil
uses gw.financials.PolicyPeriodFXRateCache
uses gw.pl.persistence.core.Key
uses gw.pl.persistence.core.effdate.EffDatedVersionList
uses nz.co.acc.lob.ind.rating.INDCostData
uses productmodel.EMPWPCLine
uses typekey.Currency

class EMPWorkAccountLevyCostData extends EMPCostData<EMPWorkAccountLevyCost> {

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
    assertKeyType(coveredItemID, EMPWPCCov)
    _coveredItemID = coveredItemID
  }

  construct(cost: EMPWorkAccountLevyCost) {
    super(cost)
    _coveredItemID = cost.EMPWPCCov.FixedId
  }

  construct(cost: EMPWorkAccountLevyCost, rateCache: PolicyPeriodFXRateCache) {
    super(cost, rateCache)
    _coveredItemID = cost.EMPWPCCov.FixedId
  }

  override function setSpecificFieldsOnCost(line: EMPWPCLine, costEntity: EMPWorkAccountLevyCost): void {
    super.setSpecificFieldsOnCost(line, costEntity)
    costEntity.setFieldValue("EMPWPCCov", _coveredItemID)
  }

  override function getVersionedCosts(line: EMPWPCLine): List<EffDatedVersionList> {
    var coveredItemVL = EffDatedUtil.createVersionList(line.Branch, _coveredItemID) as EMPWPCCovVersionList
    return coveredItemVL.EMPWorkAccountLevyCosts.where(\costVL -> isCostVersionListForThisCostData(costVL))
  }

  private function isCostVersionListForThisCostData(costVL: EMPWorkAccountLevyCostVersionList): boolean {
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