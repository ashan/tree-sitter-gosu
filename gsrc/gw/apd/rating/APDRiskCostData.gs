package gw.apd.rating

uses entity.windowed.APDRiskCostVersionList
uses entity.windowed.APDRiskCoverableVersionList
uses gw.api.effdate.EffDatedUtil
uses gw.financials.PolicyPeriodFXRateCache
uses gw.pl.persistence.core.effdate.EffDatedVersionList
uses entity.APDRiskCoverable
uses typekey.Currency
@Export
class APDRiskCostData<R extends APDRiskCost> extends APDCostData<R> {
  private var _risk : APDRiskCoverable as readonly RiskCoverable

  construct(effDate: Date, expDate: Date, c: Currency, rateCache: PolicyPeriodFXRateCache, costCode : CostCode, risk : APDRiskCoverable) {
    super(effDate, expDate, c, rateCache, costCode)
    init(risk)
  }

  construct(effDate : Date, expDate : Date, costCode : CostCode, risk : APDRiskCoverable) {
    super(effDate, expDate, costCode)
    init(risk)
  }

  construct(cost: R) {
    super(cost)
    init(cost.RiskCoverable)
  }

  construct(cost: R, rateCache: PolicyPeriodFXRateCache) {
    super(cost, rateCache)
    init(cost.RiskCoverable)
  }

  private function init(risk : APDRiskCoverable) {
    _risk = risk
  }

  override function setSpecificFieldsOnCost(line: APDManualPolicyLine, costEntity: R) {
    super.setSpecificFieldsOnCost(line, costEntity)
    costEntity.setRiskCoverable(_risk)
  }

  override function getVersionedCosts(line: APDManualPolicyLine): List<EffDatedVersionList> {
    var versionList = EffDatedUtil.createVersionList(line.Branch, _risk.FixedId) as APDRiskCoverableVersionList
    return versionList.RiskCosts.where(\ verList -> isCostVersionListForThisCostData(verList)).toList()
  }

  private function isCostVersionListForThisCostData(costVL: APDRiskCostVersionList): boolean {
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
            and v1.RiskCoverable.FixedId == _risk.FixedId

  }

  protected override property get KeyValues(): List<Object> {
    var result: List<Object> = {_risk.FixedId}
    result.addAll(super.KeyValues)
    return result
  }
}