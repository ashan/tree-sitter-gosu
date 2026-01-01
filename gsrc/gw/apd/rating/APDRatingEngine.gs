package gw.apd.rating

uses gw.rating.CostData
uses gw.rating.AbstractRatingEngine
uses gw.rating.RateFlowLogger

uses java.math.BigDecimal


uses java.lang.Iterable
uses java.math.RoundingMode

uses gw.financials.Prorater
uses gw.plugin.Plugins
uses gw.plugin.policyperiod.IPolicyTermPlugin
@Export
class APDRatingEngine extends AbstractRatingEngine<APDManualPolicyLine> {
  var _sliceCosts : ArrayList<APDCostData>

  static var _rfLogger = RateFlowLogger.Logger
//  var _minimumRatingLevel: RateBookStatus
//  var _baseRatingDate: Date
//  var _uwCompanyRateFactor: BigDecimal
//  var _jurisdiction: Jurisdiction
//  var _renewal: boolean
//  var _linePatternCode: String
//  var _offeringCode: String,

  construct(line: APDManualPolicyLine) {
    this(line, RateBookStatus.TC_ACTIVE)
  }

  construct(line: APDManualPolicyLine, minimumRatingLevel: RateBookStatus) {
    super(line, minimumRatingLevel)
//    _jurisdiction = line.Branch.BaseState
//    _baseRatingDate = line.Branch.RateAsOfDate
//    _uwCompanyRateFactor = line.Branch.getUWCompanyRateFactor(_baseRatingDate, _jurisdiction)
//    _minimumRatingLevel = minimumRatingLevel
//    _renewal = line.Branch.JobProcess typeis RenewalProcess
//    _linePatternCode = line.PatternCode
//    var offering = line.Branch.Offering
//    if (offering != null) {
//      _offeringCode = offering.PublicID
//    }
  }

  override protected function rateSlice(lineVersion: APDManualPolicyLine) {
    assertSliceMode(lineVersion)
    _sliceCosts = new ArrayList<APDCostData>()

    if (lineVersion.Branch.isCanceledSlice()) {
      // Do nothing if this is a canceled slice
    } else {
      // for each line, rate coverable
      for (riskLine in lineVersion.RiskCoverables.whereTypeIs(APDRiskPolicyLine)) {
        rateCoverable(riskLine)
      }
    }

    addCosts(_sliceCosts)
  }

  // rate coverable
  private function rateCoverable(risk : APDRiskCoverable) {
    // for each child, rate coverable
    for (child in risk.ChildRiskCoverables) {
      rateCoverable(child)
    }

    // set slice dates
    final var start = risk.SliceDate
    final var end = getNextSliceDateAfter(start)

    // for each coverage, create coverage costs
    for (cov in risk.RiskCoverages.orderBy(\rc  -> rc.Coverage.PricingOrder)) {
      for (price in cov.CostPricing.where(\p -> p.Rate != null or p.ExposurePrices.HasElements).orderBy(\p -> p.CostDefinition.PricingOrder)) {
        if (price.CostDefinition.isCumulativeCostBasis()) {
          price.priorCostCurrenciesFor(_sliceCosts).each(\cur -> {
            final var costData = new APDRiskCovCostData(start, end, cur, RateCache, price.CostDefinition.CostCode, cov, null, null)
            populateCostData(costData, price)
            if (costData.StandardTermAmount != 0){
              _sliceCosts.add(costData)
            }
          })
        } else {
          if (price.CostDefinition.CostingByExposure) {
            price.ExposurePrices.where(\ep -> ep.Rate != null).each(\ep -> {
              final var costData = new APDRiskCovCostData(start, end, price.Currency, RateCache, price.CostDefinition.CostCode, cov, ep.RiskExposure, ep.RiskCoverable)
              populateCostData(costData, price, ep)
              if (costData.StandardTermAmount != 0) {
                _sliceCosts.add(costData)
              }
            })
          } else {
            final var costData = new APDRiskCovCostData(start, end, price.Currency, RateCache, price.CostDefinition.CostCode, cov, null, null)
            populateCostData(costData, price)
            if (costData.StandardTermAmount != 0){
              _sliceCosts.add(costData)
            }
          }
        }
      }
    }
    // create coverable costs
    for (price in risk.CostPricing.where(\p -> p.Rate != null).orderBy(\p -> p.CostDefinition.PricingOrder)) {
      if (price.CostDefinition.isCumulativeCostBasis()) {
        price.priorCostCurrenciesFor(_sliceCosts).each(\cur -> {
          final var costData = new APDRiskCostData(start, end, cur, RateCache, price.CostDefinition.CostCode, risk)
          populateCostData(costData, price)
          if (costData.StandardTermAmount != 0){
            _sliceCosts.add(costData)
          }
        })
      } else {
        final var costData = new APDRiskCostData(start, end, price.Currency, RateCache, price.CostDefinition.CostCode, risk)
        populateCostData(costData, price)
        if (costData.StandardTermAmount != 0) {
          _sliceCosts.add(costData)
        }
      }
    }

  }

  private function populateCostData(costData : APDCostData, price : APDPricing) {
    populateCostData(costData, price, null)
  }
  private function populateCostData(costData : APDCostData, price : APDPricing, exposurePrice : APDExposurePrice) {
    costData.Overridable = costData.CostCode.Overrideable
    if (costData.Overridable) {
      costData.init(PolicyLine)
    }
    costData.ChargeGroup = price.ChargeGroup
    costData.BillGroup = price.BillGroup
    if (costData.ProrationMethod == ProrationMethod.TC_FLAT){
      costData.NumDaysInRatedTerm = PolicyLine.Branch.NumDaysInPeriod
    } else {
      costData.NumDaysInRatedTerm = this.NumDaysInCoverageRatedTerm
    }
    var priceRate : BigDecimal
    if (price.CostDefinition.CostingByExposure) {
      costData.Basis = exposurePrice.PriceBasis
      priceRate = exposurePrice.Rate
    } else {
      costData.Basis = price.getFullBasis(_sliceCosts, costData.Currency)
      priceRate = price.Rate
    }

    if (costData.Overridable) {
      final var baseRate = costData.setBaseRateAndHandleOverrides(priceRate)
      final var adjRate = costData.setAdjRateAndHandleOverrides(price.getAdjustedRate(baseRate))
      costData.setTermAmountAndHandleOverrides(price.calculateAmount(adjRate, costData.Basis).setScale(RoundingLevel, this.RoundingMode))
    } else {
      costData.StandardBaseRate   = priceRate
      costData.StandardAdjRate    = price.getAdjustedRate(costData.StandardBaseRate)
      costData.StandardTermAmount = price.calculateAmount(costData.StandardAdjRate, costData.Basis).setScale(RoundingLevel, this.RoundingMode)
      costData.copyStandardColumnsToActualColumns()
    }
  }

  /******
   * This default version of this method will not create any costs for the entire period.  Instead, it assumes that all costs are created
   * as part of calculating the pro rata premium for each slice of effective time.  If a policy does need to create Costs for the entire
   * period (such as a cancellation short rate penalty or a non-linear premium discount), then this method should be overridden to implement
   * that logic.
   ******/
  override protected function rateWindow(line: APDManualPolicyLine) {
  }

  // Used by the extractCostDatasFromExistingCosts method.  Must be implemented if that method is going to be called
  override protected function createCostDataForCost(c: Cost): CostData {
    var cd: CostData

    switch (typeof c) {
      case APDRiskCost:
        cd = new APDRiskCostData(c, RateCache)
        break
      case APDRiskCovCost:
        cd = new APDRiskCovCostData(c, RateCache)
        break
      default:
        throw "Unexpected cost type ${c.DisplayName}"
    }
    return cd
  }

  /******
   * This default version of this method will return all of the Costs on a policy for the slice's effective date.  If some of the
   * costs on a policy are created as part of the "rate window" portion of the rating algorithm (that is, they are created at the
   * end for the entire period rather than created as part of rating each slice in time), then these costs should be excluded
   * from what is returned by this method.  Override this method to return only the types of costs that would be created during the
   * rateSlice portion of the algorithm in that case.
   ******/
  override protected function existingSliceModeCosts(): Iterable<Cost> {
    return PolicyLine.Costs
  }

  protected property get RoundingLevel(): int {
    return PolicyLine.Branch.Policy.Product.QuoteRoundingLevel
  }

  protected property get RoundingMode(): RoundingMode {
    return PolicyLine.Branch.Policy.Product.QuoteRoundingMode
  }

  override property get NumDaysInCoverageRatedTerm(): int {
    var prorater = Prorater.forFinancialDays(TC_PRORATABYDAYS)
    var endDate = Plugins.get(IPolicyTermPlugin).calculatePeriodEnd(Branch.StartOfRatedTerm, TermType.TC_ANNUAL, Branch)
    return prorater.financialDaysBetween(endDate, Branch.StartOfRatedTerm)
  }
}