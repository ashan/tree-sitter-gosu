package nz.co.acc.lob.cpx.rating

uses entity.windowed.CPXInfoCov_ACCVersionList
uses entity.windowed.INDCPXCovVersionList
uses entity.windowed.INDCPXEarnersLevyCostVersionList
uses entity.windowed.INDCoPCovVersionList
uses entity.windowed.INDCoPEarnersLevyCostVersionList
uses gw.api.effdate.EffDatedUtil
uses gw.financials.PolicyPeriodFXRateCache
uses gw.pl.persistence.core.Key
uses gw.pl.persistence.core.effdate.EffDatedVersionList
uses nz.co.acc.lob.ind.rating.INDCostData
uses productmodel.INDCoPLine
uses typekey.Currency

class CPXEarnersLevyCostData_ACC extends CPXCostData<INDCPXEarnersLevyCost> {

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
    assertKeyType(coveredItemID, CPXInfoCov_ACC)
    _coveredItemID = coveredItemID
  }

  construct(cost: INDCPXEarnersLevyCost) {
    super(cost)
    _coveredItemID = cost.CPXInfoCov.FixedId
  }

  construct(cost: INDCPXEarnersLevyCost, rateCache: PolicyPeriodFXRateCache) {
    super(cost, rateCache)
    _coveredItemID = cost.CPXInfoCov.FixedId
  }

  override function setSpecificFieldsOnCost(line: INDCPXLine, costEntity: INDCPXEarnersLevyCost): void {
    super.setSpecificFieldsOnCost(line, costEntity)
    costEntity.setFieldValue("CPXInfoCov", _coveredItemID)
  }

  override function getVersionedCosts(line: INDCPXLine): List<EffDatedVersionList> {
    var coveredItemVL = EffDatedUtil.createVersionList(line.Branch, _coveredItemID) as CPXInfoCov_ACCVersionList
    return coveredItemVL.INDCPXEarnersLevyCosts.where(\costVL -> isCostVersionListForThisCostData(costVL))
  }

  private function isCostVersionListForThisCostData(costVL: INDCPXEarnersLevyCostVersionList): boolean {
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