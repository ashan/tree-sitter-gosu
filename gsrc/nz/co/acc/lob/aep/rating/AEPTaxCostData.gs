package nz.co.acc.lob.aep.rating

uses gw.financials.PolicyPeriodFXRateCache
uses gw.pl.persistence.core.effdate.EffDatedVersionList

class AEPTaxCostData extends AEPCostData<AEPTaxCost_ACC> {

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

  construct(cost: AEPTaxCost_ACC) {
    super(cost)
  }

  construct(cost: AEPTaxCost_ACC, rateCache: PolicyPeriodFXRateCache) {
    super(cost, rateCache)
  }

  override function setSpecificFieldsOnCost(line: AEPLine_ACC, costEntity: AEPTaxCost_ACC): void {
    super.setSpecificFieldsOnCost(line, costEntity)
  }

  override function getVersionedCosts(line: AEPLine_ACC): List<EffDatedVersionList> {
    return line.VersionList.AEPCosts.where(\ costVL ->
        {
          var firstCost = costVL.AllVersions.first()
          if (firstCost typeis AEPTaxCost_ACC and firstCost.ChargePattern == this.ChargePattern)
            return true
          else
            return false
        }).toList()
  }

  protected override property get KeyValues(): List<Object> { return {} }


}