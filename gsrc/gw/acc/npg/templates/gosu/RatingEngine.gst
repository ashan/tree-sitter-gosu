<% uses gw.acc.npg.model.ProductLine %>
<%@ params(productLine:ProductLine) %>
package ${productLine.LOBPackageName}.rating

uses gw.rating.CostData
uses gw.rating.AbstractRatingEngine
uses gw.rating.RateFlowLogger

uses java.util.Date
uses java.math.BigDecimal

uses gw.job.RenewalProcess

uses java.lang.Iterable
uses java.math.RoundingMode

uses gw.financials.Prorater
uses gw.plugin.Plugins
uses gw.plugin.policyperiod.IPolicyTermPlugin

class ${productLine.RatingEngineName} extends AbstractRatingEngine<${productLine.LineEntityName}> {

  static var _rfLogger = RateFlowLogger.Logger
  var _minimumRatingLevel: RateBookStatus
  var _baseRatingDate: Date
  var _uwCompanyRateFactor: BigDecimal
  var _jurisdiction: Jurisdiction
  var _renewal: boolean
  var _linePatternCode: String
  var _offeringCode: String

  construct(line: ${productLine.LineEntityName}) {
    this(line, RateBookStatus.TC_ACTIVE)
  }

  construct(line: ${productLine.LineEntityName}, minimumRatingLevel: RateBookStatus) {
    super(line)
    _jurisdiction = line.Branch.BaseState
    _baseRatingDate = line.Branch.RateAsOfDate
    _uwCompanyRateFactor = line.Branch.getUWCompanyRateFactor(_baseRatingDate, _jurisdiction)
    _minimumRatingLevel = minimumRatingLevel
    _renewal = line.Branch.JobProcess typeis RenewalProcess
    _linePatternCode = line.PatternCode
    var offering = line.Branch.Offering
    if (offering != null) {
      _offeringCode = offering.PublicID
    }
  }

  override protected function rateSlice(lineVersion: ${productLine.LineEntityName}) {
    assertSliceMode(lineVersion)

    if (lineVersion.Branch.isCanceledSlice()) {
      // Do nothing if this is a canceled slice
    } else {
      var sliceStart = lineVersion.SliceDate
      var sliceEnd = getNextSliceDateAfter(sliceStart)

      /***********
       *
       * Rating logic for rating 1 slice of the line goes here
       *
       ***********/

    }

  }

  /******
   * This default version of this method will not create any costs for the entire period.  Instead, it assumes that all costs are created
   * as part of calculating the pro rata premium for each slice of effective time.  If a policy does need to create Costs for the entire
   * period (such as a cancellation short rate penalty or a non-linear premium discount), then this method should be overridden to implement
   * that logic.
   ******/
  override protected function rateWindow(line: ${productLine.LineEntityName}) {
  }

  // Used by the extractCostDatasFromExistingCosts method.  Must be implemented if that method is going to be called
  override protected function createCostDataForCost(c: Cost): CostData {
    var cd: CostData

    switch (typeof c) {
      // Each Cost subtype should be listed here, creating a corresponding CostData subtype.  For example...
      // case XXXCost:
      //   cd = new PSL3LocThingCovCostData(c, RateCache)
      //   break
<%for(var cost in productLine.AllCosts){%>
      case ${cost.EntityName}:
        cd = new ${cost.CostDataImplName}(c, RateCache)
        break<%}%>
      default:
        throw "Unexpected cost type \${c.DisplayName}"
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

  private function getRateBook(refDate: Date): RateBook {
    return RateBook.selectRateBook(refDate, _baseRatingDate, _linePatternCode, _jurisdiction, _minimumRatingLevel, _renewal, _offeringCode)
  }

  override property get NumDaysInCoverageRatedTerm(): int {
    var prorater = Prorater.forFinancialDays(TC_PRORATABYDAYS)
    var endDate = Plugins.get(IPolicyTermPlugin).calculatePeriodEnd(Branch.StartOfRatedTerm, Branch.Policy.Product.DefaultTermType, Branch)
    return prorater.financialDaysBetween(endDate, Branch.StartOfRatedTerm)
  }
}
