package nz.co.acc.lob.emp.rating

uses gw.financials.PolicyPeriodFXRateCache
uses gw.api.effdate.EffDatedUtil
uses gw.pl.persistence.core.effdate.EffDatedVersionList
uses entity.windowed.EMPWPCCovVersionList
uses entity.windowed.EMPWPCLiableEarningsCostVersionList

uses java.util.Date

uses gw.pl.persistence.core.Key

class EMPWPCLiableEarningsCostData extends EMPCostData<EMPWPCLiableEarningsCost> {

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

  construct(cost: EMPWPCLiableEarningsCost) {
    super(cost)
    _coveredItemID = cost.EMPWPCCov.FixedId
  }

  construct(cost: EMPWPCLiableEarningsCost, rateCache: PolicyPeriodFXRateCache) {
    super(cost, rateCache)
    _coveredItemID = cost.EMPWPCCov.FixedId
  }

  override function setSpecificFieldsOnCost(line: EMPWPCLine, costEntity: EMPWPCLiableEarningsCost): void {
    super.setSpecificFieldsOnCost(line, costEntity)
    costEntity.setFieldValue("EMPWPCCov", _coveredItemID)
  }

  override function getVersionedCosts(line: EMPWPCLine): List<EffDatedVersionList> {
    var coveredItemVL = EffDatedUtil.createVersionList(line.Branch, _coveredItemID) as EMPWPCCovVersionList
    return coveredItemVL.EMPWPCLiableEarningsCosts.where(\costVL -> isCostVersionListForThisCostData(costVL))
  }

  private function isCostVersionListForThisCostData(costVL: EMPWPCLiableEarningsCostVersionList): boolean {
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