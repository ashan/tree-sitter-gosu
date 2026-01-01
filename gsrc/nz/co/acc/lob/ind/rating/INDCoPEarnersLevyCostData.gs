package nz.co.acc.lob.ind.rating

uses entity.windowed.INDCoPCovVersionList
uses entity.windowed.INDCoPEarnersLevyCostVersionList
uses entity.windowed.INDCoPLiableEarningsCostVersionList
uses gw.api.effdate.EffDatedUtil
uses gw.financials.PolicyPeriodFXRateCache
uses gw.pl.persistence.core.Key
uses gw.pl.persistence.core.effdate.EffDatedVersionList
uses typekey.Currency
uses productmodel.INDCoPLine

class INDCoPEarnersLevyCostData extends INDCostData<INDCoPEarnersLevyCost> {

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
    assertKeyType(coveredItemID, INDCoPCov)
    _coveredItemID = coveredItemID
  }

  construct(cost: INDCoPEarnersLevyCost) {
    super(cost)
    _coveredItemID = cost.INDCoPCov.FixedId
  }

  construct(cost: INDCoPEarnersLevyCost, rateCache: PolicyPeriodFXRateCache) {
    super(cost, rateCache)
    _coveredItemID = cost.INDCoPCov.FixedId
  }

  override function setSpecificFieldsOnCost(line: INDCoPLine, costEntity: INDCoPEarnersLevyCost): void {
    super.setSpecificFieldsOnCost(line, costEntity)
    costEntity.setFieldValue("INDCoPCov", _coveredItemID)
  }

  override function getVersionedCosts(line: INDCoPLine): List<EffDatedVersionList> {
    var coveredItemVL = EffDatedUtil.createVersionList(line.Branch, _coveredItemID) as INDCoPCovVersionList
    return coveredItemVL.INDCoPEarnersLevyCosts.where(\costVL -> isCostVersionListForThisCostData(costVL))
  }

  private function isCostVersionListForThisCostData(costVL: INDCoPEarnersLevyCostVersionList): boolean {
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