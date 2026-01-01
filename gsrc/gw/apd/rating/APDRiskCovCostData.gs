package gw.apd.rating

uses entity.windowed.APDRiskCovCostVersionList
uses entity.windowed.APDRiskCoverageVersionList
uses gw.api.effdate.EffDatedUtil
uses gw.financials.PolicyPeriodFXRateCache
uses gw.pl.persistence.core.effdate.EffDatedVersionList
uses entity.APDRiskCoverable
uses typekey.Currency
uses entity.APDRiskExposure

@Export
class APDRiskCovCostData<R extends APDRiskCovCost> extends APDCostData<R> {
  private var _cov : APDRiskCoverage as readonly RiskCoverage
  private var _exp : APDRiskExposure
  private var _risk : APDRiskCoverable

  construct(effDate: Date, expDate: Date, c: Currency, rateCache: PolicyPeriodFXRateCache, costCode : CostCode, cov : APDRiskCoverage, exp : APDRiskExposure, risk : APDRiskCoverable) {
    super(effDate, expDate, c, rateCache, costCode)
    init(cov, exp, risk)
  }

  construct(effDate : Date, expDate : Date, costCode : CostCode, cov : APDRiskCoverage, exp : APDRiskExposure, risk : APDRiskCoverable) {
    super(effDate, expDate, costCode)
    init(cov, exp, risk)
  }

  construct(cost: R) {
    super(cost)
    init(cost.RiskCoverage, cost.Exposure, cost.Risk)
  }

  construct(cost: R, rateCache: PolicyPeriodFXRateCache) {
    super(cost, rateCache)
    init(cost.RiskCoverage, cost.Exposure, cost.Risk)
  }

  private function init(cov : APDRiskCoverage, exp : APDRiskExposure, risk : APDRiskCoverable) {
    _cov = cov
    _exp = exp
    _risk = risk
  }

  override function setSpecificFieldsOnCost(line: APDManualPolicyLine, costEntity: R) {
    super.setSpecificFieldsOnCost(line, costEntity)
    costEntity.setRiskCoverage(_cov)
    costEntity.setExposure(_exp)
    costEntity.setRisk(_risk)
  }

  override function getVersionedCosts(line: APDManualPolicyLine): List<EffDatedVersionList> {
    var versionList = EffDatedUtil.createVersionList(line.Branch, _cov.FixedId) as APDRiskCoverageVersionList
    return versionList.RiskCovCosts.where(\ verList -> isCostVersionListForThisCostData(verList)).toList()
  }

  private function isCostVersionListForThisCostData(costVL: APDRiskCovCostVersionList): boolean {
    // cost key details are the same for all costs in a cost version list, so the first represents them all
    var v1 = costVL.AllVersions.first()
    return  // standard keys
        v1.CoverageCurrency == this.Currency
            and v1.ChargePattern == this.ChargePattern
            and v1.ChargeGroup == this.ChargeGroup
            and v1.RateAmountType == this.RateAmountType
            and v1.BillGroup == this.BillGroup
            and v1.CostCode == this.CostCode
            // additional keys
            and v1.RiskCoverage.FixedId == _cov.FixedId
            and v1.Exposure.FixedId == _exp.FixedId
            and v1.Risk.FixedId == _risk.FixedId
  }

  protected override property get KeyValues(): List<Object> {
    var result: List<Object> = {_cov.FixedId, _exp.FixedId, _risk.FixedId}
    result.addAll(super.KeyValues)
    return result
  }
}