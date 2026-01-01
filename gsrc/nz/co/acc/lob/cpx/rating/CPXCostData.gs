package nz.co.acc.lob.cpx.rating

uses gw.rating.CostDataWithOverrideSupport
uses gw.financials.PolicyPeriodFXRateCache

uses java.util.Date

uses gw.pl.persistence.core.Key

abstract class CPXCostData<R extends CPXCost> extends CostDataWithOverrideSupport<R, INDCPXLine> {

  construct(effDate: Date, expDate: Date) {
    super(effDate, expDate)
  }

  construct(effDate: Date, expDate: Date, c: Currency, rateCache: PolicyPeriodFXRateCache) {
    super(effDate, expDate, c, rateCache)
  }

  construct(c: R) {
    super(c)
  }

  construct(cost: R, rateCache: PolicyPeriodFXRateCache) {
    super(cost, rateCache)
  }

  override function setSpecificFieldsOnCost(line: INDCPXLine, cost: R) {
    cost.setFieldValue("INDCPXLine", line.FixedId)
  }

  protected override property get KeyValues(): List<Object> {
    return {}  // Return an empty list
  }

}