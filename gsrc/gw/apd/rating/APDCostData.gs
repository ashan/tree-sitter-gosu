package gw.apd.rating

uses gw.financials.PolicyPeriodFXRateCache
uses gw.rating.CostDataWithOverrideSupport
uses entity.APDCost
uses typekey.Currency

@Export
abstract class APDCostData<R extends APDCost> extends CostDataWithOverrideSupport<R, APDManualPolicyLine> {

  construct(effDate: Date, expDate: Date, costCode : CostCode) {
    super(effDate, expDate, costCode)
  }

  construct(effDate: Date, expDate: Date, c: Currency, rateCache: PolicyPeriodFXRateCache, costCode : CostCode) {
    super(effDate, expDate, c, rateCache, costCode)
  }

  construct(c: R) {
    super(c)
  }

  construct(cost: R, rateCache: PolicyPeriodFXRateCache) {
    super(cost, rateCache)
  }


  override function setSpecificFieldsOnCost(line: APDManualPolicyLine, cost: R) {
    cost.setManualPolicyLine(line)
  }

  protected override property get KeyValues(): List<Object> {
    var result: List<Object> = {}
    return result
  }

}