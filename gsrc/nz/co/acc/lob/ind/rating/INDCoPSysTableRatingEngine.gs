package nz.co.acc.lob.ind.rating

uses gw.api.productmodel.CoveragePattern
uses gw.financials.Prorater
uses gw.pl.persistence.core.Key
uses gw.plugin.Plugins
uses gw.plugin.policyperiod.IPolicyTermPlugin
uses gw.rating.AbstractRatingEngine
uses gw.rating.CostData
uses gw.rating.CostDataWithOverrideSupport
uses nz.co.acc.lob.common.rating.AbstractRatingEngine_ACC

/**
 * Created by ManubaF on 12/12/2016.
 */
class INDCoPSysTableRatingEngine extends AbstractRatingEngine_ACC<INDCoPLine> {

  var _baseRatingDate : Date

  /**
   * Constructs a new rating engine instance based around the particular line.
   *
   * @param line
   */
  construct(line: INDCoPLine) {
    super(line, RateBookStatus.TC_ACTIVE);
    _baseRatingDate = line.Branch.FirstPeriodInTerm.getReferenceDateForCurrentJob( line.BaseState )
  }

  override protected function existingSliceModeCosts() : Iterable<Cost> {
    return PolicyLine.Costs
  }

  override protected function rateSlice(lineVersion : INDCoPLine) {
    assertSliceMode(lineVersion)

    if(lineVersion.Branch.isCanceledSlice()) {

    } else {
      // Rate line-level coverages per vehicle

      for (cov in lineVersion.INDCoPCovs) {
          rateLineCoverage(cov)
      }
    }
  }

  override protected function rateWindow(lineVersion : INDCoPLine) {
    assertSliceMode(lineVersion)

    if(lineVersion.Branch.isCanceledSlice()) {

    } else {
      // Rate line-level coverages per vehicle

      for (cov in lineVersion.INDCoPCovs) {
        rateLineCoverage(cov)
      }
    }
  }

  protected override function createDeductibleTaxCostData(): CostData<Cost, PolicyLine> {
    return null
  }

  protected override function createNonDeductibleTaxCostData(): CostData<Cost, PolicyLine> {
    return null
  }

  override function createModifierCostData(effDate: Date, expDate: Date, coveredItemID: Key, modifier: Key, modifierDate : Key): CostDataWithOverrideSupport<Cost, PolicyLine> {
    return null
  }

  override function createModifierCostData(effDate: Date, expDate: Date, coveredItemID: Key, modifier: Key): CostDataWithOverrideSupport<Cost, PolicyLine> {
    return null
  }

  override function getProvisionalModifierCosts(): Cost[] {
    return null
  }

  protected override property get NumDaysInCoverageRatedTerm(): int {
    var firstPeriod = Branch.FirstPeriodInTerm
    var startDate = firstPeriod.StartOfRatedTerm // on a rewrite-remainder, uses the start date of the original term

    // Find the number of days in the six-month period, based on the original period of the term.
    // Use date reconciliation logic in case the date is subject to reconciliation.
    var endDate = Plugins.get(IPolicyTermPlugin).calculatePeriodEndFromBasedOn(startDate, TermType.TC_HALFYEAR, firstPeriod, true)
    var p = Prorater.forFinancialDays(TC_PRORATABYDAYS)
    return p.financialDaysBetween(startDate, endDate)
  }

  protected function rateLineCoverage(cov : INDCoPCov) {
    assertSliceMode(cov)
    switch (typeof cov) {
      case INDCoPCov:  rateINDCoPCov(cov)
      break
    }
  }

  private function rateINDCoPCov(cov: INDCoPCov) {

  }

}