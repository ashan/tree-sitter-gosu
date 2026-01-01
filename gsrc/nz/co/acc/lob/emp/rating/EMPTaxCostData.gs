package nz.co.acc.lob.emp.rating

uses gw.financials.PolicyPeriodFXRateCache
uses gw.pl.persistence.core.effdate.EffDatedVersionList
uses typekey.Currency

class EMPTaxCostData extends EMPCostData<EMPTaxCost> {

  construct(effDate: Date, expDate: Date, c: Currency, rateCache: PolicyPeriodFXRateCache) {
    super(effDate, expDate, c, rateCache)
    init()
  }

  construct(effDate: Date, expDate: Date) {
    super(effDate, expDate)
    init()
  }

  construct(effDate: Date, expDate: Date, c: Currency, rateCache: PolicyPeriodFXRateCache, chargepattern : ChargePattern) {
    super(effDate, expDate, c, rateCache)
    init()
    ChargePattern = chargepattern
  }

  private function init() {
    RateAmountType = TC_TAXSURCHARGE
    ChargePattern = this.ChargePattern
  }

  construct(cost: EMPTaxCost) {
    super(cost)
  }

  construct(cost: EMPTaxCost, rateCache: PolicyPeriodFXRateCache) {
    super(cost, rateCache)
    this.StandardAmount = cost.StandardAmount_amt
  }

  override function setSpecificFieldsOnCost(line: EMPWPCLine, costEntity: EMPTaxCost): void {
    super.setSpecificFieldsOnCost(line, costEntity)
   }

  override function getVersionedCosts(line: EMPWPCLine): List<EffDatedVersionList> {
    return line.VersionList.EMPCosts.where(\ costVL ->
        {
          var firstCost = costVL.AllVersions.first()
          if (firstCost typeis EMPTaxCost and firstCost.ChargePattern == this.ChargePattern)
            return true
          else
            return false
        }).toList()
  }

  protected override property get KeyValues(): List<Object> { return {} }

}