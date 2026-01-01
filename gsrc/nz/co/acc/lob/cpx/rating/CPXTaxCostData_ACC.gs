package nz.co.acc.lob.cpx.rating

uses gw.financials.PolicyPeriodFXRateCache
uses gw.pl.persistence.core.effdate.EffDatedVersionList
uses nz.co.acc.lob.ind.rating.INDCostData
uses productmodel.INDCoPLine
uses typekey.Currency

class CPXTaxCostData_ACC extends CPXCostData<INDCPXTaxCost> {

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

  construct(cost: INDCPXTaxCost) {
    super(cost)
  }

  construct(cost: INDCPXTaxCost, rateCache: PolicyPeriodFXRateCache) {
    super(cost, rateCache)
  }

  override function setSpecificFieldsOnCost(line: INDCPXLine, costEntity: INDCPXTaxCost): void {
    super.setSpecificFieldsOnCost(line, costEntity)
   }

  override function getVersionedCosts(line: INDCPXLine): List<EffDatedVersionList> {
    return line.VersionList.CPXCosts.where(\ costVL ->
        {
          var firstCost = costVL.AllVersions.first()
          if (firstCost typeis INDCPXTaxCost and firstCost.ChargePattern == this.ChargePattern)
            return true
          else
            return false
        }).toList()
  }

  protected override property get KeyValues(): List<Object> { return {} }

}