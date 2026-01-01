package nz.co.acc.lob.ind.rating

uses gw.financials.PolicyPeriodFXRateCache
uses gw.pl.currency.MonetaryAmount
uses gw.pl.persistence.core.effdate.EffDatedVersionList
uses productmodel.INDCoPLine
uses typekey.Currency

class INDCoPTaxCostData extends INDCostData<INDCoPTaxCost> {
  construct(effDate: Date, expDate: Date, c: Currency, rateCache: PolicyPeriodFXRateCache) {
    super(effDate, expDate, c, rateCache)
    init()
  }

  construct(effDate: Date, expDate: Date) {
    super(effDate, expDate)
    init()
  }

  private function init() {
    RateAmountType = TC_TAXSURCHARGE
    ChargePattern = ChargePattern.TC_GST
  }

  construct(cost: INDCoPTaxCost) {
    super(cost)
  }

  construct(cost: INDCoPTaxCost, rateCache: PolicyPeriodFXRateCache) {
    super(cost, rateCache)
  }

  override function setSpecificFieldsOnCost(line: INDCoPLine, costEntity: INDCoPTaxCost): void {
    super.setSpecificFieldsOnCost(line, costEntity)
   }

  override function getVersionedCosts(line: INDCoPLine): List<EffDatedVersionList> {
    return line.VersionList.INDCosts.where(\ costVL ->
        {
          var firstCost = costVL.AllVersions.first()
          if (firstCost typeis INDCoPTaxCost and firstCost.ChargePattern == this.ChargePattern)
            return true
          else
            return false
        }).toList()
  }

  protected override property get KeyValues(): List<Object> { return {} }

}