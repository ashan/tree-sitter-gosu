package nz.co.acc.lob.shc.rating

uses gw.financials.PolicyPeriodFXRateCache
uses gw.pl.persistence.core.effdate.EffDatedVersionList
uses typekey.Currency
uses productmodel.CWPSLine

/**
 * Created by ManubaF on 20/01/2017.
 */
class SHCNonDeductibleTaxCostData extends SHCCostData<SHCNonDeductibleTaxCost> {
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

  construct(cost: SHCNonDeductibleTaxCost) {
    super(cost)
  }

  construct(cost: SHCNonDeductibleTaxCost, rateCache: PolicyPeriodFXRateCache) {
    super(cost, rateCache)
    this.StandardAmount = cost.StandardAmount_amt
  }

  override function setSpecificFieldsOnCost(line: CWPSLine, costEntity: SHCNonDeductibleTaxCost): void {
    super.setSpecificFieldsOnCost(line, costEntity)
  }

  override function getVersionedCosts(line: CWPSLine): List<EffDatedVersionList> {
    return line.VersionList.SHCCosts.where(\ costVL ->
        {
          var firstCost = costVL.AllVersions.first()
          if (firstCost typeis SHCNonDeductibleTaxCost and firstCost.ChargePattern == this.ChargePattern)
            return true
          else
            return false
        }).toList()
  }

  protected override property get KeyValues(): List<Object> { return {} }
}