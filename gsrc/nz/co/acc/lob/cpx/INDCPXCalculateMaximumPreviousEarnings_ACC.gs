package nz.co.acc.lob.cpx

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.api.util.CurrencyUtil
uses gw.api.util.DateUtil
uses gw.pl.currency.MonetaryAmount
uses gw.util.Pair
uses nz.co.acc.lob.util.LiableEarningsUtilities_ACC

uses java.math.BigDecimal
uses java.math.RoundingMode
uses java.text.NumberFormat

/**
 * Created by Ian Rainford on 27/04/2017.
 */
class INDCPXCalculateMaximumPreviousEarnings_ACC {
  private static final var PREVIOUS_PERIOD = 0
  private static final var PREVIOUS_PERIOD_MINUS_ONE = -1
  private static final var PREVIOUS_PERIOD_MINUS_TWO = -2
  private static final var PREVIOUS_PERIOD_MINUS_THREE = -3

  private static final var SE_PREVIOUS_PERIODS: int[] = {PREVIOUS_PERIOD, PREVIOUS_PERIOD_MINUS_ONE, PREVIOUS_PERIOD_MINUS_TWO}
  private static final var WPS_PREVIOUS_PERIODS : int[] = {PREVIOUS_PERIOD_MINUS_ONE, PREVIOUS_PERIOD_MINUS_TWO, PREVIOUS_PERIOD_MINUS_THREE}

  private static final var PREVIOUS_YEARS_FOR_SE_CP_MAX_ADJUSTMENT = -1

  private static final var ZERO = new MonetaryAmount(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP), CurrencyUtil.getDefaultCurrency())
  private static final var REPLACEMENT_LABOUR_COST_FACTOR = ScriptParameters.getParameterValue("CPXMaxCoverPermittedRLCPercentage_ACC") as BigDecimal
  private static final var REPLACEMENT_LABOUR_COST_PERCENTAGE = REPLACEMENT_LABOUR_COST_FACTOR * 100
  private static final var AVERAGE_LIABLE_EARNINGS_FACTOR = ScriptParameters.getParameterValue("CPXMaxCoverPermittedAvgLEPercentage_ACC") as BigDecimal
  private static var calculationRules : List<CalculationRule>

  private var _seAdjustedLiableEarnings: PreviousEarnings as SeAdjustedLiableEarnings
  private var _wpsAdjustedLiableEarnings: PreviousEarnings as WpsAdjustedLiableEarnings

  private var _seActualLiableEarnings: PreviousEarnings as SeActualLiableEarnings
  private var _wpsActualLiableEarnings : PreviousEarnings as WpsActualLiableEarnings

  private enum CalculationType {
    SumAndDivideByThree,
    SumAndDivideByTwoOrRLC,
    SumOfLastYearsEarnings,
    RLCCostOnly,
    Default
  }

  construct(policyPeriod : PolicyPeriod) {
    calculatePreviousSEEarnings(policyPeriod)
    calculatePreviousWPSEarnings(policyPeriod)

    if (calculationRules == null) {
      calculationRules = new ArrayList<CalculationRule>()
    /*
      Rules based matching - this was built to cover any specific rules on the LE not covered in the simplyfied logic for
      deriving the type of formula to build, Example Rule here shows:
        - The type of calculation to apply
        - SE liable earnings for years Last, Second, Third, true = value is non zero
        - SHE liable earnings for years Last, Second, Third, true = value is non zero

      createCalcRule(CalculationType.SumAndDivideByThree, {true, true, true}, {false, false, false})
     */
    }
  }

  class CalculationRule {
    private var _calculationType : CalculationType as CalculationType
    private var _sheRules : Boolean[] as SHERules
    private var _seRules : Boolean[] as SERules
    construct(calculationType : CalculationType, sheRules : Boolean[], seRules : Boolean[]) {
      _calculationType = calculationType
      _sheRules = sheRules
      _seRules = seRules
    }
    function toString() : String {
      return ("${_calculationType} SHE:${_sheRules[0]} ${_sheRules[1]} ${_sheRules[2]}, SE:${_seRules[0]} ${_seRules[1]} ${_seRules[2]}")
    }
  }

  class PreviousEarnings {
    private var _last : MonetaryAmount as Last = ZERO
    private var _second : MonetaryAmount as Second = ZERO
    private var _third : MonetaryAmount as Third = ZERO
    private var _lastLevyYear : Integer as LastLevyYear

    construct(last : MonetaryAmount, second : MonetaryAmount, third : MonetaryAmount) {
      setValues(last, second, third)
    }

    construct(last : MonetaryAmount, second : MonetaryAmount, third : MonetaryAmount, lastLevyYear : Integer) {
      setValues(last, second, third)
      _lastLevyYear = lastLevyYear
    }

    function setValues(last : MonetaryAmount, second : MonetaryAmount, third : MonetaryAmount) {
      if (last != null) _last = last
      if (second != null) _second = second
      if (third != null) _third = third
    }

    function toString() : String {
      return "Last:${Last.toString()}, Second:${Second.toString()}, Third:${Third.toString()}"
    }
  }

  class PreviousPeriods {
    private var _last : List<PolicyPeriod> as Last = new ArrayList<PolicyPeriod>()
    private var _second : List<PolicyPeriod> as Second = new ArrayList<PolicyPeriod>()
    private var _third : List<PolicyPeriod> as Third = new ArrayList<PolicyPeriod>()
  }

  class PreviousPeriodDates {
    private var _last : Date as Last
    private var _second : Date as Second
    private var _third : Date as Third
    construct(last : Date, second : Date, third : Date) {
      _last = last
      _second = second
      _third = third
    }
  }

  function createEarnings(last : MonetaryAmount, second : MonetaryAmount, third : MonetaryAmount) : PreviousEarnings {
    return new PreviousEarnings(last, second, third)
  }

  /**
   * Get the replacement labour cost. If the replacement labour cost is null, then get it from the database.
   * @param bicCode
   * @return the replacement labour cost
   */
  public function calculateReplacementLabourCost(bicCode : PolicyLineBusinessClassificationUnit_ACC) : MonetaryAmount {
    // DE1235 - lookup the replacement labour cost if it is null
    var replacementLabourCost = new MonetaryAmount(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP), Currency.TC_NZD)
    if (bicCode != null) {
      replacementLabourCost = bicCode?.ReplacementLabourCost
      if (replacementLabourCost == null) {
        var query = Query.make(ClassificationUnit_ACC)
        query.compare(ClassificationUnit_ACC#ClassificationUnitCode, Relop.Equals, bicCode?.CUCode)
        query.compare(ClassificationUnit_ACC#StartDate, Relop.Equals, bicCode?.PolicyLineRef.AssociatedPolicyPeriod.PeriodStart.trimToMidnight())
        query.compare(ClassificationUnit_ACC#EndDate, Relop.Equals, bicCode?.PolicyLineRef.AssociatedPolicyPeriod.PeriodEnd.trimToMidnight())
        var classificationUnit = query.select().AtMostOneRow
        replacementLabourCost = classificationUnit.ReplacementLabourCost
      }
    }
    return replacementLabourCost
  }

  /**
   *
   * @param policyPeriod
   * @param replacementLabourCost
   * @return a Pair
   *  <li>First is the label containing the static calculation formula</li>
   *  <li>Second is the calculation result</li>
   * @see Pair
   */
  public function calculateMaximumPreviousEarnings(replacementLabourCost: MonetaryAmount) : Pair<String, MonetaryAmount> {

    //Try to match first with specific Rules, if any
    var rule = determineCalculationRuleByRules()

    //if default (no match) attempt a logic based match
    if (rule == Default) {
      rule = determineCalculationRule()
    }

    switch (rule) {
      case SumAndDivideByThree:
        return sumAndDivideByThreePlus30Percent()

      case SumAndDivideByTwoOrRLC:
        return sumAndDivideByTwoOrRLC(replacementLabourCost)

      case SumOfLastYearsEarnings:
        return sumOfLastYearsEarnings(replacementLabourCost)

      case RLCCostOnly:
        return buildRLCEquation(replacementLabourCost)

      case Default:
        return null
    }
  }

  private function formatAmount(monetaryAmount:BigDecimal) : String {
    return NumberFormat.getCurrencyInstance().format(monetaryAmount)
  }

  private function sumAndDivideByThreePlus30Percent() : Pair<String, MonetaryAmount> {
    return buildSumOfEarningsEquation(3, sumOfEarningsDividedBy(3))
  }

  private function sumAndDivideByTwoOrRLC(replacementLabourCost: MonetaryAmount) : Pair<String, MonetaryAmount> {
    var avgValue = sumOfEarningsDividedBy(2)
    var largestOf = getLargestValueOf(replacementLabourCost, avgValue).setScale(2)
    // Earnings is larger then the RLC
    if (avgValue == largestOf) {
      return buildSumOfEarningsEquation(2, largestOf)
    } else {
      return applyCPXMaximumCoverPermittedThreshold(new Pair("${REPLACEMENT_LABOUR_COST_PERCENTAGE.DisplayValue}% of RLC = ${formatAmount(largestOf.Amount)}}", largestOf))
    }
  }

  private function sumOfLastYearsEarnings(replacementLabourCost: MonetaryAmount) : Pair<String, MonetaryAmount> {
    var avgValue = sumOfEarnings()
    var largestOf = getLargestValueOf(replacementLabourCost, avgValue).setScale(2)
    // Earnings is larger then the RLC
    if (avgValue == largestOf) {
      return buildSumOfEarningsEquation(avgValue)
    } else {
      return applyCPXMaximumCoverPermittedThreshold(new Pair("${REPLACEMENT_LABOUR_COST_PERCENTAGE.DisplayValue}% of RLC = ${formatAmount(largestOf.Amount)}", largestOf))
    }
  }

  private function buildSumOfEarningsEquation(total : MonetaryAmount) : Pair<String, MonetaryAmount> {
    return buildSumOfEarningsEquation(1, total)
  }

  private function buildSumOfEarningsEquation(withDivisor : int, total : MonetaryAmount) : Pair<String, MonetaryAmount> {
    var values = new ArrayList<String>()
    if (hasEarnings(WpsAdjustedLiableEarnings.Last)) values.add(formatAmount(WpsAdjustedLiableEarnings.Last.Amount))
    if (hasEarnings(WpsAdjustedLiableEarnings.Second)) values.add(formatAmount(WpsAdjustedLiableEarnings.Second.Amount))
    if (hasEarnings(WpsAdjustedLiableEarnings.Third)) values.add(formatAmount(WpsAdjustedLiableEarnings.Third.Amount))
    if (hasEarnings(SeAdjustedLiableEarnings.Last)) values.add(formatAmount(SeAdjustedLiableEarnings.Last.Amount))
    if (hasEarnings(SeAdjustedLiableEarnings.Second)) values.add(formatAmount(SeAdjustedLiableEarnings.Second.Amount))
    if (hasEarnings(SeAdjustedLiableEarnings.Third)) values.add(formatAmount(SeAdjustedLiableEarnings.Third.Amount))
    if (withDivisor == 0) {
      return null
    } else if (withDivisor == 1) {
      var totalAmount = formatAmount(total.Amount)
      return applyCPXMaximumCoverPermittedThreshold(new Pair("100% of ${totalAmount} = ${totalAmount}", total))
    } else if (withDivisor == 2){
      return applyCPXMaximumCoverPermittedThreshold(new Pair("(${values.join(" + ")}) / ${withDivisor} = ${formatAmount(total.Amount)}", total))
    } else if (withDivisor == 3) {
      var maxCoverPermittedValue = total.add(total.multiply(AVERAGE_LIABLE_EARNINGS_FACTOR)).setScale(2, RoundingMode.HALF_UP)
      return applyCPXMaximumCoverPermittedThreshold(new Pair("(${values.join(" + ")}) / ${withDivisor} + ${AVERAGE_LIABLE_EARNINGS_FACTOR.multiply(100)}% = ${formatAmount(maxCoverPermittedValue.Amount)}", maxCoverPermittedValue))
    } else {
      return new Pair(null, null)
    }
  }

  private function applyCPXMaximumCoverPermittedThreshold(maxCoverPermittedPair: Pair<String, MonetaryAmount>) : Pair<String, MonetaryAmount> {
    var cpxMaximumCoverPermittedThreshold = ScriptParameters.CPXMaximumCoverPermittedThreshold_ACC
    return cpxMaximumCoverPermittedThreshold > maxCoverPermittedPair.Second ? new Pair<String, MonetaryAmount>("Automatic Approval threshold = ${formatAmount(cpxMaximumCoverPermittedThreshold.Amount)}", cpxMaximumCoverPermittedThreshold) : maxCoverPermittedPair
  }

  private function buildRLCEquation(replacementLabourCost: MonetaryAmount) : Pair<String, MonetaryAmount> {
    if (replacementLabourCost == null) return new Pair(null, null)
    var maxCoverPermittedValue = replacementLabourCost?.multiply(REPLACEMENT_LABOUR_COST_FACTOR)?.setScale(2, RoundingMode.HALF_UP)
    return applyCPXMaximumCoverPermittedThreshold(new Pair("${REPLACEMENT_LABOUR_COST_FACTOR.multiply(100).DisplayValue}% of RLC = ${formatAmount(maxCoverPermittedValue.Amount)}", maxCoverPermittedValue))
  }

  private function getLargestValueOf(replacementLabourCost : MonetaryAmount, totalEarnings : MonetaryAmount) : MonetaryAmount {
    var rlc = (replacementLabourCost?.multiply(REPLACEMENT_LABOUR_COST_FACTOR))
    if (rlc?.compareTo(totalEarnings) > 0) {
      return rlc
    }
    return totalEarnings.setScale(2, RoundingMode.HALF_UP)
  }

  private function sumOfEarningsDividedBy(divisor : int) : MonetaryAmount {
   return sumOfEarnings().divide(divisor).setScale(2, RoundingMode.HALF_UP)
  }

  private function sumOfEarnings() : MonetaryAmount {
    var sumOfSHE = WpsAdjustedLiableEarnings.Last.add(WpsAdjustedLiableEarnings.Second).add(WpsAdjustedLiableEarnings.Third)
    var sumOfSE = SeAdjustedLiableEarnings.Last.add(SeAdjustedLiableEarnings.Second).add(SeAdjustedLiableEarnings.Third)
    return sumOfSHE.add(sumOfSE).setScale(2, RoundingMode.HALF_UP)
  }

  private function createCalcRule(ruleType : CalculationType, sheRules : Boolean[], seRules : Boolean[]) {
    calculationRules.add(new CalculationRule(ruleType, sheRules, seRules))
  }

  private function hasEarnings(value : MonetaryAmount) : Boolean {
    return value != ZERO
  }

  private function noEarnings(value : MonetaryAmount) : Boolean {
    return value == ZERO
  }

  private function determineCalculationRule() : CalculationType {

/*
Rule 2: 3 year calcs, a person has been trading/shareholder for 3 years, 	Average of 3 years earnings  by income type + 30 %
Rule 2.b: 3 year calcs (gap year in between), a person has been trading/shareholder for 3 years -	Average of 3 years earnings  by income type + 30 %
 */
      if (hasEarnings(WpsAdjustedLiableEarnings.Third) or hasEarnings(SeAdjustedLiableEarnings.Third)) {
        return CalculationType.SumAndDivideByThree
      }
/*
Rule 3: 2 year calcs, a person has been trading/shareholder for 2 years	 - Average of 2 years earnings by income type OR 60% of Replacement Labour Cost - which ever is the greatest
*/
      if (hasEarnings(WpsAdjustedLiableEarnings.Second) or hasEarnings(SeAdjustedLiableEarnings.Second)) {
        return CalculationType.SumAndDivideByTwoOrRLC
      }
/*
Rule 4: 1 year, a person has been trading/shareholder for 1 years	100% of previous year’s earnings OR 60 % of Replacement labour cost whichever is greater.
 */
      if (hasEarnings(WpsAdjustedLiableEarnings.Last) or hasEarnings(SeAdjustedLiableEarnings.Last)) {
        return CalculationType.SumOfLastYearsEarnings
      }

/*
Rule 5: no year available, a person has just started 60% of labour cost replacement
Rule 6: which basis to apply-  no earnings, 1 year, 2 years, 3 years
  - decision on what rule to apply (1 year, no earnings, 2 year, or 3 year rule to apply)
  - is based on how many years an individual has been trading as SE or has been a shareholder

 */
      return CalculationType.RLCCostOnly //No Earnings
  }

  private function determineCalculationRuleByRules() : CalculationType {
    //Attempt to match by a rules based method
    for (rule in calculationRules) {
      if ((hasEarnings(WpsAdjustedLiableEarnings.Last)  == rule.SHERules[0]) and
          (hasEarnings(WpsAdjustedLiableEarnings.Second) == rule.SHERules[1]) and
          (hasEarnings(WpsAdjustedLiableEarnings.Third) == rule.SHERules[2]) and
          (hasEarnings(SeAdjustedLiableEarnings.Last) == rule.SERules[0]) and
          (hasEarnings(SeAdjustedLiableEarnings.Second) == rule.SERules[1]) and
          (hasEarnings(SeAdjustedLiableEarnings.Third) == rule.SERules[2])){
        //rule match found
        return rule.CalculationType
      }
    }
    //No match, return default
    return CalculationType.Default
  }

  private function calculatePreviousSEEarnings(aPolicyPeriod: PolicyPeriod) {
    var sePreviousPeriodDates = calculatePreviousPeriodDates(SE_PREVIOUS_PERIODS, aPolicyPeriod)
    var sePreviousPeriods = calculatePreviousCPPeriods(sePreviousPeriodDates, aPolicyPeriod)

    //Get the Liable earnings for CoP and Populate the earnings
    var lastPeriod = sePreviousPeriods.Last.first()
    var lastSEEarnings = INDCPXCovUtil_ACC.getINDCoPCovTotalLiableEarnings(lastPeriod, aPolicyPeriod)
    var secondSEEarnings = INDCPXCovUtil_ACC.getINDCoPCovTotalLiableEarnings(sePreviousPeriods.Second.first(), lastPeriod)
    var thirdSEEarnings = INDCPXCovUtil_ACC.getINDCoPCovTotalLiableEarnings(sePreviousPeriods.Third.first(), sePreviousPeriods.Second.first())

    _seActualLiableEarnings = new PreviousEarnings(lastSEEarnings, secondSEEarnings, thirdSEEarnings, aPolicyPeriod.LevyYear_ACC - 1)

    _seAdjustedLiableEarnings = new PreviousEarnings(
        LiableEarningsUtilities_ACC.adjustAmountWithCPMax(lastSEEarnings, sePreviousPeriodDates.Last.addYears(PREVIOUS_YEARS_FOR_SE_CP_MAX_ADJUSTMENT)),
        LiableEarningsUtilities_ACC.adjustAmountWithCPMax(secondSEEarnings, sePreviousPeriodDates.Second.addYears(PREVIOUS_YEARS_FOR_SE_CP_MAX_ADJUSTMENT)),
        LiableEarningsUtilities_ACC.adjustAmountWithCPMax(thirdSEEarnings, sePreviousPeriodDates.Third.addYears(PREVIOUS_YEARS_FOR_SE_CP_MAX_ADJUSTMENT)), aPolicyPeriod.LevyYear_ACC - 1)
  }

  private function calculatePreviousWPSEarnings(aPolicyPeriod: PolicyPeriod) {
    var cpxPolicy = aPolicyPeriod.Policy
    var wpsPreviousPeriodDates = calculatePreviousPeriodDates(WPS_PREVIOUS_PERIODS, aPolicyPeriod)
    var wpsPreviousPeriods = calculatePreviousWPSPeriods(wpsPreviousPeriodDates, aPolicyPeriod)

    //Get the Liable earnings for WPS and Populate the earnings
    var lastWPSEarnings =  INDCPXCovUtil_ACC.sumOfWPSShareholderEarningsForContact(wpsPreviousPeriods.Last, cpxPolicy.Account.AccountHolderContact)
    var secondWPSEarnings =  INDCPXCovUtil_ACC.sumOfWPSShareholderEarningsForContact(wpsPreviousPeriods.Second, cpxPolicy.Account.AccountHolderContact)
    var thirdWPSEarnings =  INDCPXCovUtil_ACC.sumOfWPSShareholderEarningsForContact(wpsPreviousPeriods.Third, cpxPolicy.Account.AccountHolderContact)

    // Get the start of the current policyPeriod.
    // set the actual dd/mm to 01/04 as this will always match any previous period END date
    var periodStartdate = aPolicyPeriod.PeriodStart
    var levyStartDate = (DateUtil.createDateInstance(INDCPXCovUtil_ACC.accLevyYearStartMonth,
                                                     INDCPXCovUtil_ACC.accLevyYearStartDay,
                                                     DateUtil.getYear(periodStartdate))).addMinutes(1)

    _wpsActualLiableEarnings = new PreviousEarnings(lastWPSEarnings, secondWPSEarnings, thirdWPSEarnings,
                                                    levyStartDate.YearOfDate - 1 )

    _wpsAdjustedLiableEarnings = new PreviousEarnings(
        LiableEarningsUtilities_ACC.adjustAmountWithCPMax(lastWPSEarnings, wpsPreviousPeriodDates.Last),
        LiableEarningsUtilities_ACC.adjustAmountWithCPMax(secondWPSEarnings, wpsPreviousPeriodDates.Second),
        LiableEarningsUtilities_ACC.adjustAmountWithCPMax(thirdWPSEarnings, wpsPreviousPeriodDates.Third), levyStartDate.YearOfDate - 1)
  }

  private function calculatePreviousPeriodDates(periods : int[], aPolicyPeriod: PolicyPeriod) : PreviousPeriodDates {
    // Get the start of the current policyPeriod.
    // set the actual dd/mm to 01/04 as this will always match any previous period END date
    var periodStartdate = aPolicyPeriod.PeriodStart
    var levyStartDate = (DateUtil.createDateInstance(INDCPXCovUtil_ACC.accLevyYearStartMonth, INDCPXCovUtil_ACC.accLevyYearStartDay, DateUtil.getYear(periodStartdate))).addMinutes(1)
    return new PreviousPeriodDates(levyStartDate?.addYears(periods[0]), levyStartDate?.addYears(periods[1]), levyStartDate?.addYears(periods[2]))
  }

  private function calculatePreviousCPPeriods(previousPeriodDates : PreviousPeriodDates, aPolicyPeriod: PolicyPeriod) : PreviousPeriods {
    var thePolicy = aPolicyPeriod.Policy

    var lastACCLevyYrPeriod = thePolicy.BoundPeriods.where(\elt -> elt.PeriodEnd == previousPeriodDates.Last).orderByDescending(\h -> h.CreateTime).first()
    var secondACCLevyYrPeriod = thePolicy.BoundPeriods.where(\elt -> elt.PeriodEnd == previousPeriodDates.Second ).orderByDescending(\h -> h.CreateTime).first()
    var thirdLastACCLevyYrPeriod = thePolicy.BoundPeriods.where(\elt -> elt.PeriodEnd == previousPeriodDates.Third ).orderByDescending(\h -> h.CreateTime).first()

    var periods = new PreviousPeriods()
    periods.Last.add(lastACCLevyYrPeriod)
    periods.Second.add(secondACCLevyYrPeriod)
    periods.Third.add(thirdLastACCLevyYrPeriod)

    return periods
  }

  private function calculatePreviousWPSPeriods(previousPeriodDates : PreviousPeriodDates, aPolicyPeriod: PolicyPeriod) : PreviousPeriods {
    var cpxPolicy = aPolicyPeriod.Policy
    var periods =  new PreviousPeriods()

    // Need to get associated accounts. When Using findPolicyPeriods, if the shareholder is added at final audit,
    // the policy does not appear to be associated with the contact. see commit history for latter method
    var lastACCLevyYrPeriods = cpxPolicy.Account.AccountHolderContact.AssociationFinder.findAccounts().map(\elt ->
        elt.Policies).flatMap(\elt -> elt).flatMap(\el -> el.Periods).where(\elt ->
        elt.PeriodEnd == previousPeriodDates.Last).toList()

    var secondACCLevyYrPeriods = cpxPolicy.Account.AccountHolderContact.AssociationFinder.findAccounts().map(\elt ->
        elt.Policies).flatMap(\elt -> elt).flatMap(\el -> el.Periods).where(\elt ->
        elt.PeriodEnd == previousPeriodDates.Second).toList()

    var thirdLastACCLevyYrPeriods = cpxPolicy.Account.AccountHolderContact.AssociationFinder.findAccounts().map(\elt ->
        elt.Policies).flatMap(\elt -> elt).flatMap(\el -> el.Periods).where(\elt ->
        elt.PeriodEnd == previousPeriodDates.Third).toList()

    partitionPolicyAndPeriods(lastACCLevyYrPeriods).each(\elt -> getLatestFinalAuditPolicyPeriod(elt, periods.Last))
    partitionPolicyAndPeriods(secondACCLevyYrPeriods).each(\elt -> getLatestFinalAuditPolicyPeriod(elt, periods.Second))
    partitionPolicyAndPeriods(thirdLastACCLevyYrPeriods).each(\elt -> getLatestFinalAuditPolicyPeriod(elt, periods.Third))

    return periods
  }

  private function getLatestFinalAuditPolicyPeriod(policyPeriod : PolicyPeriod, finalAuditPolicyPeriods : List<PolicyPeriod>) {
    var finalAuditPeriod = policyPeriod.CompletedNotReversedFinalAudits.sortBy(\info -> info.CreateTime).last()?.Audit?.PolicyPeriod
    if (finalAuditPeriod != null) {
      finalAuditPolicyPeriods.add(finalAuditPeriod)
    }
  }

  //Partition each Policy into a collection of PolicyPeriods
  //Return the first PolicyPeriod for each Policy
  private function partitionPolicyAndPeriods(policyPeriods : List<PolicyPeriod>) : List<PolicyPeriod> {
    return policyPeriods.partition(\p ->
        { return p.Policy }).Values.flatMap<PolicyPeriod>(\l ->
        { return {l.first() }
      }
    )
  }

}