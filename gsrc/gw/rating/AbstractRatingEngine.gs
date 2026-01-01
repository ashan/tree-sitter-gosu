package gw.rating

uses gw.job.RenewalProcess
uses entity.PolicyLine
uses gw.rating.worksheet.DeferredDiagRateflowParamRef
uses java.math.BigDecimal
uses gw.rating.worksheet.DeferredDiagRatingWorksheetRef
uses java.math.RoundingMode
uses entity.DiagnosticRatingWorksheet
uses entity.DiagRatingWorksheetRef

/**
 * The AbstractRatingEngine class serves as the base for all of the out of the box rating engines.  This class
 * provides both a basic structure for rating, used by most (but not all) of the out of the box lines of business,
 * as well as utility methods to do things like prorate and merge costs and determine if rating should be
 * done from the start of the period or merely from the change date forward.
 *
 * All demo rating in PolicyCenter is line-specific, so each line has its own subtype of this class.
 *
 * The general structure for out of the box demo rating engines is:
 * 1) rate slices - We find all the dates on which anything changes anywhere in the policy, and rate certain things
 *                  (like standard vehicle or building coverages) from that date until the next date something changes
 *                  We rate what we can per-slice because it makes it much easier to traverse the graph and not worry about
 *                  what changes when, simplifying the rating logic.
 *
 * 2) merge and prorate - Since rating per slice results in lots of little pieces of cost, we want to merge those that
 *                        are equivalent.  Most costs are merged if they have the same rates and basis, while "basis-scalable" costs
 *                        that are not prorated by time are merged slightly differently.  Once the costs are merged, any rate-scalable
 *                        costs have their term amount prorated into an actual amount
 *
 * 3) rate window costs - Costs that depend on the sum of previous costs, or that span the whole period rather than particular points
 *                        in time, are rated in "window" mode.  Window mode rating is generally highly order-dependent; for example
 *                        discounts should be rated first, followed by any cancellation penalty, followed by taxes.
 *
 * 4) persist costs - Once all the CostData objects are fully assembled and correct, they're persisted to the database as Cost entities
 */
@Export
abstract class AbstractRatingEngine<PL extends PolicyLine> extends AbstractRatingEngineBase<PL> {
  var _line : PL

  var _rateBook : RateBook as readonly RateBook
  protected var _jurisdiction: Jurisdiction
  protected var _linePatternCode: String
  protected var _minimumRatingLevel: RateBookStatus
  protected var _renewal: boolean
  protected var _offeringCode: String
  // used to determine which set of BIC codes to use for the rating engine
  protected var _submission : boolean as Audit = false

  /**
   * Constructs a new rating engine instance based around the particular line.
   */
  construct(line : PL, minimumRatingLevel: RateBookStatus) {
    super(line.Branch)
    _line = line

    initializeCostDataMap(line)
    _minimumRatingLevel = minimumRatingLevel
    _jurisdiction = _line.Branch.BaseState
    _linePatternCode = _line.PatternCode
    _renewal = line.Branch.JobProcess typeis RenewalProcess
    var offering = line.Branch.Offering
    if (offering != null) {
      _offeringCode = offering.PublicID
    }
    _rateBook = getRateBook(_line.Branch.PeriodStart)
  }

  property get PolicyLine() : PL {
    return _line
  }

  /**
   * When rating from the change date forward, we need to extract any existing slice-mode costs and create CostData
   * objects to represent them.  We don't want to extract all costs, since that would include things like taxes,
   * which will be rated when we rate in window mode.  This method, then, should return any costs currently on
   * the period that correspond to costs that are generated during the rateSlice() method.
   *
   * This method needs to be implemented provided that the subclass doesn't completely override the rateOnly()
   * method and also doesn't override shouldRateThisSliceForward() to always return false.
   */
  override protected function existingSliceModeCosts() : Iterable<Cost> {
    throw "Not implemented"
  }

  /**
   * The callout to rate a given slice of the policy.  The lineVersion argument will already have its slice date
   * set to the appropriate method, and this function will be called once per slice in the policy.
   *
   * This method needs to be implemented provided that the subclass doesn't completely override the rateOnly() method
   */
  override protected function rateSlice(lineVersion : PL) {
    throw "Not implemented"
  }

  /**
   * The callout to rate the policy in "window" mode, rating things that depend on the sum of the previous slice costs
   * or that need to span the entire period and be rated just once instead of per-slice.  The argument in this case
   * will be the first version of the line in effective time.
   *
   * This method needs to be implemented provided that the subclass doesn't completely override the rateOnly() method
   */
  override protected function rateWindow(lineVersion : PL) {
    throw "Not implemented"
  }

  /**
   * Given the specified Cost entity, this method should create the appropriate CostData class.  This method is used
   * by the extractCostDatasFromExistingCosts, and must be able to handle any Cost returned by the existingSliceModeCosts()
   * method.
   *
   * This method needs to be implemented provided that the subclass doesn't completely override the rateOnly()
   * method and also doesn't override shouldRateThisSliceForward() to always return false.
   */
  override protected function createCostDataForCost(c : Cost) : CostData {
    throw "createCostDataForCost is not implemented by this rating engine"
  }

  /**
   * This method handles CalcRoutineExecutionException by generating a real diagnostic rating worksheet and attaching
   * it to the policy line.
   */
  override protected function handleCalcRoutineException(exception : CalcRoutineExecutionException) {
    var diagRatingWorksheet = exception.DiagnosticRatingWorksheet.generateDiagRatingWorksheetForLine(PolicyLine)
    PolicyLine.addToDiagnosticRatingWorksheets(diagRatingWorksheet)
  }

  /**
   * Log message emitted by rate().  This is implemented as a property so that it can be overridden by subclasses.
   */
  override protected property get RatingLogMessage() : String {
    return "Rating " + PolicyLine + "..."
  }

  // PolicyLine - specific implementations, marked final because any inconsistencies between these could result in
  // subtle and hard-to-find bugs.   Proceed with caution!

  override protected final function getVersionsOnDates(dates : List<Date>) : List<PL> {
    return PolicyLine.getVersionsOnDates(dates)
  }

  override protected final function getSliceDate(slice : PL) : Date {
    return slice.SliceDate
  }

  override protected final function getPolicyLineForCost(c : Cost): PL {
    return PolicyLine
  }

  protected function preventProRataOfLevy(data : CostData) {
    // These two values (ActualAmount and StandardAmount) must be set to prevent the pro-rata of the levy amount
    data.StandardAmount = data.ActualTermAmount
    data.ActualAmount = data.ActualTermAmount
  }

  protected function computeValuesFromCostOverrides(cost : Cost, costData : CostData, asPercentage : boolean) {
    if (cost.OverrideBaseRate != null) {
      costData.ActualBaseRate = cost.OverrideBaseRate
      costData.ActualAdjRate = cost.OverrideBaseRate
      costData.ActualTermAmount = computeTermAmount(costData, costData.ActualAdjRate, asPercentage)
      costData.ActualAmount = costData.ActualTermAmount
    } else if (cost.OverrideAdjRate != null) {
      costData.ActualBaseRate = 0
      costData.ActualAdjRate = cost.OverrideAdjRate
      costData.ActualTermAmount = computeTermAmount(costData, costData.ActualAdjRate, asPercentage)
      costData.ActualAmount = costData.ActualTermAmount
    } else if (cost.OverrideTermAmount != null) {
      costData.Basis = 0
      costData.ActualBaseRate = 0
      costData.ActualAdjRate = 0
      costData.ActualTermAmount = cost.OverrideTermAmount
    } else if (cost.OverrideAmount != null) {
      costData.Basis = 0
      costData.ActualBaseRate = 0
      costData.ActualAdjRate = 0
      costData.ActualTermAmount = 0
      costData.ActualAmount = cost.OverrideAmount
    }
  }

  protected function computeTermAmount(costData : CostData, rate : BigDecimal, asPercentage : boolean) : BigDecimal {
    return (costData.Basis * rate / (asPercentage ? 100 : 1)).setScale(2, this.RoundingMode)
  }

  // convenience functions to reduce the number of places where existing rating engines must be changed

  // For a line-specific rating engine, there should be only one lines' worth of CostDatas

  /**
   * Get the CostDatas from the CostDataMap
   * The list returned by this method is <em>Unmodifiable</em>.  To add or remove
   * items from the list you should use addCost(c : CostData) or removeCost(c : CostData).
   * To replace the entire contents of the list, set the CostDatas property.
   */
  protected property get CostDatas() : List<CostData> {
    return Collections.unmodifiableList(CostDataMap.get(PolicyLine))
  }

  /**
   * Set the CostDatas on the CostDataMap
   */
  protected property set CostDatas(values : List <CostData>) {
    var data = CostDataMap.get(PolicyLine)
    data.clear()
    data.addAll(values)
  }

  /**
   * Adds CostData to the CostDataMap
   */
  protected function addCost(c : CostData) {
    addCost(PolicyLine, c)
  }

  /**
   * Adds CostDatas to the CostDataMap
   */
  protected function addCosts(costs: List <CostData>) {
    CostDataMap.get(PolicyLine).addAll(costs)
  }

  protected function getRateBook(refDate: Date): RateBook {
    return RateBook.selectRateBook(refDate, Branch.RateAsOfDate, _linePatternCode, _jurisdiction, _minimumRatingLevel, _renewal, _offeringCode, PolicyLine.Branch.UWCompany)
  }

  protected property get RoundingLevel(): int {
    return PolicyLine.Branch.Policy.Product.QuoteRoundingLevel
  }

  protected property get RoundingMode(): RoundingMode {
    return PolicyLine.Branch.Policy.Product.QuoteRoundingMode
  }
}
