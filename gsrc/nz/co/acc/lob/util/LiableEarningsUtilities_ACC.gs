package nz.co.acc.lob.util

uses entity.BusinessIndustryCode_ACC
uses entity.ClassificationUnit_ACC
uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.api.financials.CurrencyAmount
uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.pl.currency.MonetaryAmount
uses gw.util.Pair
uses nz.co.acc.lob.common.DateUtil_ACC
uses nz.co.acc.lob.shc.util.CWPSUIUtil_ACC

uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.util.FeatureToogleUtil
uses productmodel.CWPSLine
uses typekey.Contact

uses java.lang.invoke.MethodHandles
uses java.math.BigDecimal
uses java.math.RoundingMode

/**
 * CPACC Utility class.
 */
class LiableEarningsUtilities_ACC {

  private static final var NEGATIVE_DOLLAR_VALUE = new BigDecimal(-99999999999.99)
  private static final var MIN_DOLLAR_VALUE = new BigDecimal(0.0)
  private static final var MAX_DOLLAR_VALUE = new BigDecimal(99999999999.99)
  private static final var ZERO_NZD = new MonetaryAmount(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP), Currency.TC_NZD)
  private static final var _logger = StructuredLogger.CONFIG.withClass(MethodHandles.lookup().lookupClass())
  /*
   * Function to check the field amount is with in the threshold value of Negative and Maximum dollar value
   * @param fieldAmt : The field amount which needs to be checked for
   * if not success will throw the Displayable exception with the error message
   */
  public static function checkLiableEarningsFieldValues(fieldToCheck: String, displayKey: String, fieldAmt: java.math.BigDecimal) {
    if (fieldAmt < NEGATIVE_DOLLAR_VALUE or fieldAmt > MAX_DOLLAR_VALUE)
      throw new DisplayableException(DisplayKey.get(displayKey, fieldToCheck))
  }


  /*
   * Function to check the field amount is with in the threshold value of Minimum and Maximum dollar value
   * @param fieldAmt : The field amount which needs to be checked for
   * if not success will throw the Displayable exception with the error message
   */
  public static function checkTotalOtherExpensesAmount(fieldAmt: java.math.BigDecimal) {
    if (fieldAmt < MIN_DOLLAR_VALUE or fieldAmt > MAX_DOLLAR_VALUE)
      throw new DisplayableException(DisplayKey.get("Web.CoverPlus_ACC.Coverage.LiableEarnings.ZeroMaxMoneyValidation", "Total other expenses claimed"))
  }

  public static function initialiseINDCoPLiableEarnings(liableEarnings: entity.INDLiableEarnings_ACC) {
    // The below code will set 0 to the liable earning fields if no value is set
    if (liableEarnings.NetSchedulerPayments == null)
      liableEarnings.NetSchedulerPayments = ZERO_NZD
    if (liableEarnings.TotalActivePartnershipInc == null)
      liableEarnings.TotalActivePartnershipInc = ZERO_NZD
    if (liableEarnings.AdjustedLTCIncome == null)
      liableEarnings.AdjustedLTCIncome = ZERO_NZD
    if (liableEarnings.SelfEmployedNetIncome == null)
      liableEarnings.SelfEmployedNetIncome = ZERO_NZD
    if (liableEarnings.TotalOtherExpensesClaimed == null)
      liableEarnings.TotalOtherExpensesClaimed = ZERO_NZD
    if (liableEarnings.TotalGrossIncome == null)
      liableEarnings.TotalGrossIncome = ZERO_NZD
    if (liableEarnings.TotalIncomeNotLiable == null)
      liableEarnings.TotalIncomeNotLiable = ZERO_NZD
    if (liableEarnings.TotalShareholderEmplSalary == null)
      liableEarnings.TotalShareholderEmplSalary = ZERO_NZD
    if (liableEarnings.TotalOtherNetIncome == null)
      liableEarnings.TotalOtherNetIncome = ZERO_NZD
    if (liableEarnings.TotalOverseasIncome == null)
      liableEarnings.TotalOverseasIncome = ZERO_NZD
    if (liableEarnings.TotalLiableEarnings == null)
      liableEarnings.TotalLiableEarnings = ZERO_NZD
    if (liableEarnings.AdjustedLiableEarnings == null)
      liableEarnings.AdjustedLiableEarnings = ZERO_NZD
    if (liableEarnings.EarningNotLiable == null)
      liableEarnings.EarningNotLiable = ZERO_NZD
  }

  public static function isLiableEarningsNotAllZero(policyPeriod: PolicyPeriod): boolean {
    return isLiableEarningsNotAllZero(policyPeriod, false)
  }

  public static function isLiableEarningsNotAllZero(policyPeriod: PolicyPeriod, checkForPolicyStatus: boolean): boolean {
    var result = false
    if (policyPeriod.INDCoPLineExists) {
      var earnings = policyPeriod.INDCoPLine.INDCoPCovs.first().LiableEarningCov
      if (policyPeriod.CeasedTrading_ACC or policyPeriod.IsNewLERuleAppliedYear) {
        earnings = policyPeriod?.INDCoPLine?.INDCoPCovs?.first()?.ActualLiableEarningsCov
      }
      result = checkForNonZeroINDCoPLiableEarnings(earnings) or result
    } else if (policyPeriod.EMPWPCLineExists) {
      result = checkForNonZeroEMPWPCLiableEarnings(policyPeriod.EMPWPCLine.EMPWPCCovs.first().LiableEarningCov, checkForPolicyStatus) or result
    } else if (policyPeriod.CWPSLineExists) {
      result = checkForNonZeroCWPSLiableEarnings(policyPeriod.CWPSLine) or result
    }
    return result
  }

  public static function checkForNonZeroINDCoPLiableEarnings(liableEarnings: entity.INDLiableEarnings_ACC): boolean {
    if ((liableEarnings.NetSchedulerPayments == null or liableEarnings.NetSchedulerPayments_amt.IsZero) and
        (liableEarnings.TotalActivePartnershipInc == null or liableEarnings.TotalActivePartnershipInc_amt.IsZero) and
        (liableEarnings.AdjustedLTCIncome == null or liableEarnings.AdjustedLTCIncome_amt.IsZero) and
        (liableEarnings.SelfEmployedNetIncome == null or liableEarnings.SelfEmployedNetIncome_amt.IsZero)) {
      return false
    }
    return true
  }

  public static function copyEarnings(srcLiableEarnings: entity.INDLiableEarnings_ACC,
                                      destLiableEarnings: entity.INDLiableEarnings_ACC) {
    // The below code will set 0 to the liable earning fields if no value is set
    destLiableEarnings.NetSchedulerPayments = srcLiableEarnings.NetSchedulerPayments
    destLiableEarnings.TotalActivePartnershipInc = srcLiableEarnings.TotalActivePartnershipInc
    destLiableEarnings.AdjustedLTCIncome = srcLiableEarnings.AdjustedLTCIncome
    destLiableEarnings.SelfEmployedNetIncome = srcLiableEarnings.SelfEmployedNetIncome
    destLiableEarnings.TotalOtherExpensesClaimed = srcLiableEarnings.TotalOtherExpensesClaimed
    destLiableEarnings.TotalGrossIncome = srcLiableEarnings.TotalGrossIncome
    destLiableEarnings.TotalIncomeNotLiable = srcLiableEarnings.TotalIncomeNotLiable
    destLiableEarnings.TotalShareholderEmplSalary = srcLiableEarnings.TotalShareholderEmplSalary
    destLiableEarnings.TotalOtherNetIncome = srcLiableEarnings.TotalOtherNetIncome
    destLiableEarnings.TotalOverseasIncome = srcLiableEarnings.TotalOverseasIncome
    destLiableEarnings.TotalLiableEarnings = srcLiableEarnings.TotalLiableEarnings
    destLiableEarnings.AdjustedLiableEarnings = srcLiableEarnings.AdjustedLiableEarnings
    destLiableEarnings.EarningNotLiable = srcLiableEarnings.EarningNotLiable
  }

  public static function copyEarnings(srcLiableEarnings: CPXInfoCov_ACC,
                                      destLiableEarnings: CPXInfoCov_ACC) {
    destLiableEarnings = srcLiableEarnings.shallowCopy() as CPXInfoCov_ACC
  }

  public static function checkForNonZeroINDCPXLiableEarnings(liableEarnings: CPXInfoCov_ACC[]): boolean {
    for (cpxEarning in liableEarnings) {
      if ((cpxEarning.RequestedLevelOfCover == null or cpxEarning.RequestedLevelOfCover.Amount == BigDecimal.ZERO) and
          (cpxEarning.RequestedLevelOfCover == null or cpxEarning.MaxCoverPermitted.Amount == BigDecimal.ZERO) and
          (cpxEarning.RequestedLevelOfCover == null or cpxEarning.AgreedLevelOfCover.Amount == BigDecimal.ZERO)
          ) {
        return false
      }
    }
    return true
  }

  /**
   * Setting Earning Not Liable For ACC field to 0 when Job type is Renewal.
   *
   * @param policyPeriod
   */
  public static function earningNotLiableOnRenewal(policyPeriod: PolicyPeriod) {
    if (policyPeriod.Job typeis Renewal) {
      policyPeriod.INDCoPLine.INDCoPCovs.first().LiableEarningCov.EarningNotLiable = ZERO_NZD
    }
  }

  /**
   * Called from LineWizardStepSet.IndividualACC.pcf
   *
   * @param policyPeriod
   */
  public static function onEnterIndividualACC(policyPeriod: PolicyPeriod) {
    LiableEarningsUtilities_ACC.initialiseINDCoPLiableEarnings(policyPeriod.INDCoPLine.INDCoPCovs.first().LiableEarningCov)
    LiableEarningsUtilities_ACC.earningNotLiableOnRenewal(policyPeriod)
  }

  /*
   * Function will check for if the values entered in the Liable earning fields are with in the threshold and will throw the message.
   * @param IndLiableEarnings_ACC
   */
  public static function checkAllLiableEarningsFieldAmtINDCoP(liableEarnings: entity.INDLiableEarnings_ACC) {

    initialiseINDCoPLiableEarnings(liableEarnings)

    var liableEarningFields = new LinkedHashMap<String, gw.pl.currency.MonetaryAmount>()
    liableEarningFields.put("Net schedular payments", liableEarnings.NetSchedulerPayments)
    liableEarningFields.put("Total active partnership income", liableEarnings.TotalActivePartnershipInc)
    liableEarningFields.put("Adjusted LTC income", liableEarnings.AdjustedLTCIncome)
    liableEarningFields.put("Self employed net income", liableEarnings.SelfEmployedNetIncome)
    liableEarningFields.put("Total gross income", liableEarnings.TotalGrossIncome)
    liableEarningFields.put("Total income not liable for ACC Earners' levy", liableEarnings.TotalIncomeNotLiable)
    liableEarningFields.put("Total shareholder employee salary", liableEarnings.TotalShareholderEmplSalary)
    liableEarningFields.put("Total other net income", liableEarnings.TotalOtherNetIncome)
    liableEarningFields.put("Total overseas income", liableEarnings.TotalOverseasIncome)

    checkTotalOtherExpensesAmount(liableEarnings.TotalOtherExpensesClaimed)

    var fieldSet = liableEarningFields.entrySet()
    var itrtr = fieldSet.iterator()

    while (itrtr.hasNext()) {
      var mentry = itrtr.next()
      checkLiableEarningsFieldValues(mentry.getKey(), "Web.CoverPlus_ACC.Coverage.LiableEarnings.MinMaxMoneyValidation", mentry.getValue() as BigDecimal)
    }
  }

  public static function initialiseEMPWPCLiableEarnings(liableEarnings: entity.EMPLiableEarnings_ACC) {
    // The below code will set 0 to the liable earning fields if no value is set
    if (liableEarnings.TotalGrossEarnings == null)
      liableEarnings.TotalGrossEarnings = ZERO_NZD
    if (liableEarnings.TotalEarningsNotLiable == null)
      liableEarnings.TotalEarningsNotLiable = ZERO_NZD
    if (liableEarnings.TotalPAYE == null)
      liableEarnings.TotalPAYE = ZERO_NZD
    if (liableEarnings.TotalExcessPaid == null)
      liableEarnings.TotalExcessPaid = ZERO_NZD
    if (liableEarnings.EmbassyWorkerEarnings_ACC == null)
      liableEarnings.EmbassyWorkerEarnings_ACC = ZERO_NZD
    if (liableEarnings.PaymentToEmployees == null)
      liableEarnings.PaymentToEmployees = ZERO_NZD
    if (liableEarnings.PaymentAfterFirstWeek == null)
      liableEarnings.PaymentAfterFirstWeek = ZERO_NZD
    if (liableEarnings.TotalLiableEarnings == null)
      liableEarnings.TotalLiableEarnings = ZERO_NZD
    if (liableEarnings.AdjustedLiableEarnings == null)
      liableEarnings.AdjustedLiableEarnings = ZERO_NZD
  }

  public static function checkForNonZeroEMPWPCLiableEarnings(liableEarnings: entity.EMPLiableEarnings_ACC): boolean {
    return checkForNonZeroEMPWPCLiableEarnings(liableEarnings, false)
  }

  public static function checkForNonZeroEMPWPCLiableEarnings(liableEarnings: entity.EMPLiableEarnings_ACC, checkGrossEarnings:boolean): boolean {
    if (checkGrossEarnings and (liableEarnings.TotalGrossEarnings == null or liableEarnings.TotalGrossEarnings.Amount == BigDecimal.ZERO)) {
      return false
    }

    if ((liableEarnings.TotalGrossEarnings == null or liableEarnings.TotalGrossEarnings.Amount == BigDecimal.ZERO) and
        (liableEarnings.TotalEarningsNotLiable == null or liableEarnings.TotalEarningsNotLiable.Amount == BigDecimal.ZERO) and
        (liableEarnings.TotalPAYE == null or liableEarnings.TotalPAYE.Amount == BigDecimal.ZERO) and
        (liableEarnings.TotalExcessPaid == null or liableEarnings.TotalExcessPaid.Amount == BigDecimal.ZERO)
        ) {
      return false
    }
    return true
  }

  public static function checkEMPWPCGrossEarnings(liableEarnings: entity.EMPLiableEarnings_ACC): boolean {
    if (liableEarnings.TotalGrossEarnings == null or liableEarnings.TotalGrossEarnings.Amount == BigDecimal.ZERO) {
      return false
    }
    return true
  }

  public static function resetBICCodesLiableEarnings(bicCodes: PolicyLineBusinessClassificationUnit_ACC[]) {
    for (bicCode in bicCodes) {
      bicCode.LiableEarnings = new CurrencyAmount(BigDecimal.ZERO, Currency.TC_NZD)
      bicCode.AdjustedLiableEarnings = new CurrencyAmount(BigDecimal.ZERO, Currency.TC_NZD)
    }
  }

  /**
   * Update the liable earnings for all shareholders
   *
   * @param wpsPolicyLine
   */
  public static function updateShareholderLiableEarnings(wpsPolicyLine: CWPSLine) {
    var shareholders = wpsPolicyLine.PolicyShareholders
    if (shareholders != null) {
      for (shareholder in shareholders) {
        shareholder.computeAllShareholderEarnings()
      }
    }
  }

  public static function clearPolicyLiableEarnings(policyPeriod: PolicyPeriod) {
    if (policyPeriod.EMPWPCLineExists) {
      nz.co.acc.lob.util.LiableEarningsUtilities_ACC.setEMPWPCLiableEarningsToZero(policyPeriod.EMPWPCLine.EMPWPCCovs.first())
    } else if (policyPeriod.CWPSLineExists) {
      nz.co.acc.lob.util.LiableEarningsUtilities_ACC.setCWPSLiableEarningsToZero(policyPeriod.CWPSLine)
    }
  }

  /*
   * Function will check for if the values entered in the Liable earning fields are with in the threshold and will throw the message.
   * @param EMPLiableEarnings_ACC
   */
  public static function checkAllLiableEarningsFieldAmtEMPWPC(liableEarnings: entity.EMPLiableEarnings_ACC) {

    initialiseEMPWPCLiableEarnings(liableEarnings)

    var liableEarningFields = new LinkedHashMap<String, gw.pl.currency.MonetaryAmount>()
    liableEarningFields.put("Total gross earnings", liableEarnings.TotalGrossEarnings)
    liableEarningFields.put("Total earnings not liable", liableEarnings.TotalEarningsNotLiable)
    liableEarningFields.put("Total PAYE", liableEarnings.TotalPAYE)
    liableEarningFields.put("Total excess paid", liableEarnings.TotalExcessPaid)
    liableEarningFields.put("Earnings as embassy worker", liableEarnings.EmbassyWorkerEarnings_ACC)
    liableEarningFields.put("Payments to employees", liableEarnings.PaymentToEmployees)
    liableEarningFields.put("Payments after first week", liableEarnings.PaymentAfterFirstWeek)

    var fieldSet = liableEarningFields.entrySet()
    var itrtr = fieldSet.iterator()

    while (itrtr.hasNext()) {
      var mentry = itrtr.next()
      checkLiableEarningsFieldValues(mentry.getKey(), "Web.WorkPlaceCover_ACC.Coverage.LiableEarnings.MinMaxMoneyValidation", mentry.getValue() as BigDecimal)
    }
  }

  /**
   * Calculate the total liable earnings for a coverage line
   *
   * @param cov : The Coverable associated with the Policy Line
   * @return the total liable earnings for a coverage line
   */
  public static function calculateTotalLiableEarningsINDCoP(cov: entity.INDCoPCov): BigDecimal {
    return calculateTotalLiableEarningsINDCoP(cov.LiableEarningCov)
  }

  /**
   * Calculate the total liable earnings for a coverage line
   *
   * @param cov : The Coverable associated with the Policy Line
   * @return the total liable earnings for a coverage line
   */
  public static function calculateTotalLiableEarningsINDCoP(liableEarnings: INDLiableEarnings_ACC): BigDecimal {
    var totalLiableEarnings = MIN_DOLLAR_VALUE
    checkAllLiableEarningsFieldAmtINDCoP(liableEarnings)
    totalLiableEarnings = calcTotalLiableEarningsINDCoP(liableEarnings.NetSchedulerPayments,
        liableEarnings.TotalActivePartnershipInc,
        liableEarnings.AdjustedLTCIncome,
        liableEarnings.SelfEmployedNetIncome,
        liableEarnings.TotalOtherExpensesClaimed,
        liableEarnings.TotalOverseasIncome,
        liableEarnings.Branch.LevyYear_ACC,
        liableEarnings.EarningNotLiable)
    if (totalLiableEarnings > MAX_DOLLAR_VALUE) {
      totalLiableEarnings = MAX_DOLLAR_VALUE
    }

    return totalLiableEarnings.setScale(2, RoundingMode.HALF_UP)
  }

  /**
   * If it is final then find the final max WPS value for the current year.
   * If it is not final i.e. provisional then find the final max WPS value for the previous year.
   *
   * @param policyEffectiveDate
   * @param isFinal
   * @return final max WPS
   */
  public static function findFinalMaxWPSValue(policyEffectiveDate: Date, isFinal: boolean): BigDecimal {
    // remove time component so the date comparisons will work
    var date = DateUtil_ACC.removeTime(policyEffectiveDate)

    if (!isFinal) { // Provisional
      // Provisional so remove a year
      date = date.addYears(-1)
    }
    var query = Query.make(EarningsMinMaxData_ACC).compare(EarningsMinMaxData_ACC#PolicyStartDate, Relop.LessThanOrEquals, date)
        .compare(EarningsMinMaxData_ACC#PolicyEndDate, Relop.GreaterThanOrEquals, date)
    var earningsMinMax = query.select().AtMostOneRow
    if (earningsMinMax != null) { // data found
      return earningsMinMax.FinalMaximumWPS_amt
    }
    return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP)
  }

  public static function findMinMaxCPValues(policyEffectiveDate: Date): Pair<BigDecimal, BigDecimal> {
    // remove time component so the date comparisons will work
    var date = DateUtil_ACC.removeTime(policyEffectiveDate)
    var query = Query.make(EarningsMinMaxData_ACC).compare(EarningsMinMaxData_ACC#PolicyStartDate, Relop.LessThanOrEquals, date)
        .compare(EarningsMinMaxData_ACC#PolicyEndDate, Relop.GreaterThanOrEquals, date)
    var earningsMinMax = query.select().AtMostOneRow
    return new Pair<BigDecimal, BigDecimal>(earningsMinMax.FullTimeMinimumCP_amt, earningsMinMax.FullTimeMaximumCP_amt)
  }

  /**
   * Adjust a given amount w.r.t. the CP Max Earning range for the year
   * - Cap the cover amounts to maximum CP limit for the year if they are above than that
   *
   * @param amountToCap
   * @param effectiveDate
   * @return the capped amount
   */
  public static function adjustAmountWithCPMax(amountToCap: MonetaryAmount, effectiveDate: Date): MonetaryAmount {
    //Lookup Min and Max CPX values for the year
    var earningsCPMinMax = findMinMaxCPValues(effectiveDate)
    var maxCP = earningsCPMinMax?.getSecond()
    if (maxCP == null) {
      throw new DisplayableException(DisplayKey.get("Web.CoverPlus_ACC.Coverage.LiableEarnings.MinMaxEarningsNotFound", effectiveDate.ShortFormat))
    }

    if (amountToCap?.compareTo(maxCP?.ofDefaultCurrency()) >= 1) {
      // Cap the cover amounts to maximum CP limit for the year if they are above than that
      return maxCP?.ofDefaultCurrency()
    } else {
      return amountToCap
    }
  }

  public static function findInflationAdjustmentPercent(policyEffectiveDate: Date): BigDecimal {
    // remove time component so the date comparisons will work
    var date = DateUtil_ACC.removeTime(policyEffectiveDate)
    var query = Query.make(InflationAdjustment_ACC).compare(InflationAdjustment_ACC#PolicyStartDate, Relop.LessThanOrEquals, date)
        .compare(InflationAdjustment_ACC#PolicyEndDate, Relop.GreaterThanOrEquals, date)
    var inflationAdjustment = query.select().AtMostOneRow
    return inflationAdjustment.RatePercent
  }

  /**
   * Calculate the adjusted liable earnings for a coverage line
   *
   * @param cov : The Coverable associated with the Policy Line
   * @return the adjusted liable earnings for a coverage line
   */
  public static function calculateAdjustedLiableEarningsEMPWPC(cov: entity.EMPWPCCov): BigDecimal {
    var totalAdjustedEarnings = MIN_DOLLAR_VALUE
    checkAllLiableEarningsFieldAmtEMPWPC(cov.getLiableEarnings())

    // Find the Inflation Rate Table value
    var policyEffectiveDate = cov.PolicyLine.EffectiveDate
    var inflationAdjustmentPercent = (cov.LiableEarningCov.InfltnAdjustmntApplied) ? findInflationAdjustmentPercent(policyEffectiveDate) : 0
    if (inflationAdjustmentPercent == null) {
      throw new DisplayableException(DisplayKey.get("Web.WorkPlaceCover_ACC.Coverage.LiableEarnings.InflationAdjustmentNotFound", policyEffectiveDate.ShortFormat))
    }

    var totalLiableEarnings = cov.LiableEarningCov.TotalLiableEarnings_amt
    totalAdjustedEarnings = totalLiableEarnings * (1 + (inflationAdjustmentPercent / 100))

    return totalAdjustedEarnings.setScale(2, RoundingMode.HALF_UP)
  }

  /**
   * Calculate the adjusted liable earnings for a coverage line
   *
   * @param cov : The Coverable associated with the Policy Line
   * @return the adjusted liable earnings for a coverage line
   */
  public static function calculateAdjustedLiableEarningsINDCoP(cov: entity.INDCoPCov): Pair<BigDecimal, String> {
    var liableEarnings: INDLiableEarnings_ACC
    if (cov.INDCoPLine.AssociatedPolicyPeriod.CeasedTrading_ACC or cov.Branch.IsNewLERuleAppliedYear) {
      liableEarnings = cov.ActualLiableEarningsCov
    } else {
      liableEarnings = cov.LiableEarningCov
    }

    return calculateAdjustedLiableEarningsINDCoP(liableEarnings)
  }

  /**
   * Calculate the adjusted liable earnings for a coverage line
   *
   * @param cov : The Coverable associated with the Policy Line
   * @return the adjusted liable earnings for a coverage line
   */
  public static function calculateAdjustedLiableEarningsINDCoP(liableEarnings: INDLiableEarnings_ACC): Pair<BigDecimal, String> {
    var isCeased = liableEarnings.Branch.CeasedTrading_ACC

    var totalAdjustedEarnings = MIN_DOLLAR_VALUE
    checkAllLiableEarningsFieldAmtINDCoP(liableEarnings)

    var variableAdjDesc = ""
    var policyEffectiveDate = liableEarnings.EffectiveDate
    var fulltime = liableEarnings.FullTime
    var totalLiableEarnings = liableEarnings.TotalLiableEarnings_amt
    var totalGrossIncome = liableEarnings.TotalGrossIncome_amt
    var totalShareholderEmplSalary = liableEarnings.TotalShareholderEmplSalary_amt
    var totalIncomeNotLiable = liableEarnings.TotalIncomeNotLiable_amt

    if (liableEarnings.individualFullTimeEarningsEmpty()) {
      // if all the earnings are zero then return zero
      return new Pair<BigDecimal, String>(totalAdjustedEarnings.setScale(2, RoundingMode.HALF_UP), variableAdjDesc)
    }

    // find the CP min and max
    var earningsMinMax = findMinMaxCPValues(policyEffectiveDate)
    var minCP = earningsMinMax.getFirst()
    var maxCP = earningsMinMax.getSecond()

    // Min/Max earnings not found in database
    if (minCP == null or maxCP == null) {
      throw new DisplayableException(DisplayKey.get("Web.CoverPlus_ACC.Coverage.LiableEarnings.MinMaxEarningsNotFound", policyEffectiveDate.ShortFormat))
    }

    // earnings as an employee
    var earningsAsAnEmployee = totalGrossIncome + totalShareholderEmplSalary - totalIncomeNotLiable
    if (earningsAsAnEmployee < MIN_DOLLAR_VALUE) {
      earningsAsAnEmployee = MIN_DOLLAR_VALUE
      variableAdjDesc = DisplayKey.get("Web.CoverPlus_ACC.Coverage.LiableEarnings.EarningsAsAnEmployeeAdjustedToZero")
    }

    if (earningsAsAnEmployee == MIN_DOLLAR_VALUE) { // BR 1
      if (totalLiableEarnings > maxCP) { // BR 1.1
        totalAdjustedEarnings = maxCP
        variableAdjDesc = DisplayKey.get("Web.CoverPlus_ACC.Coverage.LiableEarnings.LiableEarningsAdjustedDownToMax")
      } else {
        if (!fulltime) { // BR 1.2 part-time
          if (totalLiableEarnings <= maxCP) { // BR 1.2.1
            totalAdjustedEarnings = totalLiableEarnings
            variableAdjDesc = ""
          }
        } else { // BR 1.3 full-time
          if ((totalLiableEarnings >= minCP and totalLiableEarnings <= maxCP) or
              (totalLiableEarnings < minCP and isCeased)) { // BR 1.3.1
            totalAdjustedEarnings = totalLiableEarnings
            variableAdjDesc = ""
          } else if (totalLiableEarnings < minCP and !isCeased) { // BR 1.3.2
            totalAdjustedEarnings = minCP
            variableAdjDesc = DisplayKey.get("Web.CoverPlus_ACC.Coverage.LiableEarnings.LiableEarningsAdjustedUpToFullTimeMin")
          } else {

          }
        }
      }
    } else if (earningsAsAnEmployee > MIN_DOLLAR_VALUE) { // BR 2
      var sumEarnings = earningsAsAnEmployee + totalLiableEarnings
      if (sumEarnings > maxCP) { // BR 2.1
        totalAdjustedEarnings = maxCP - earningsAsAnEmployee
        variableAdjDesc = DisplayKey.get("Web.CoverPlus_ACC.Coverage.LiableEarnings.LiableEarningsAdjustedDownToMaxLessEarnings")
      } else {
        if (!fulltime) { // BR 2.2 part-time
          if (sumEarnings <= maxCP) { // BR 2.2.1
            totalAdjustedEarnings = totalLiableEarnings
            variableAdjDesc = ""
          }
        } else { // BR 2.3 full-time
          if ((sumEarnings >= minCP and sumEarnings <= maxCP) or
              (totalLiableEarnings < minCP and isCeased)) { // BR 2.3.1
            totalAdjustedEarnings = totalLiableEarnings
            variableAdjDesc = ""
          } else if (sumEarnings < minCP) { // BR 2.3.2
            totalAdjustedEarnings = minCP - earningsAsAnEmployee
            variableAdjDesc = DisplayKey.get("Web.CoverPlus_ACC.Coverage.LiableEarnings.LiableEarningsAdjustedUpToFullTimeMinLessEarnings")
          }
        }
      }
    }
    // if the total adjusted earnings is less than 0 then return 0
    if (totalAdjustedEarnings < MIN_DOLLAR_VALUE) {
      totalAdjustedEarnings = MIN_DOLLAR_VALUE
      // only display the message if no message is already displayed
      if (!variableAdjDesc.NotBlank) {
        variableAdjDesc = DisplayKey.get("Web.CoverPlus_ACC.Coverage.LiableEarnings.LiableEarningsAdjustedToZero")
      }
    }
    return new Pair<BigDecimal, String>(totalAdjustedEarnings.setScale(2, RoundingMode.HALF_UP), variableAdjDesc)
  }

  /**
   * Calculate the total liable earnings for a coverage line
   *
   * @param cov : The Coverable associated with the Policy Line
   * @return the total liable earnings for a coverage line
   */
  public static function calculateTotalLiableEarningsEMPWPC(cov: EMPWPCCov): BigDecimal {
    var totalLiableEarnings = MIN_DOLLAR_VALUE
    checkAllLiableEarningsFieldAmtEMPWPC(cov.LiableEarningCov)

    // US1957 - Exclude PaymentToEmployees and PaymentAfterFirstWeek for provisional calculations
    // New Submissions are provisional so if the job type is Submission, then don't include these liable earnings
    var provisional = cov.PolicyLine.JobType == typekey.Job.TC_SUBMISSION

    var liableEarnings = cov.getLiableEarnings()

    // DE998 - Recalculate the Embassy Worker earnings for IRD jobs
    var embassyWorkerEarnings = new MonetaryAmount(0, Currency.TC_NZD)
    if (liableEarnings.EmbassyWorker_ACC) {
      var policyPeriod = cov.PolicyLine.getAssociatedPolicyPeriod()
      var internalJob = policyPeriod.Job.InternalJob_ACC == null ? false : policyPeriod.Job.InternalJob_ACC.booleanValue()
      if (internalJob) {
        liableEarnings.recalculateEmbassyWorkersEarnings(provisional)
      }
      embassyWorkerEarnings = liableEarnings.EmbassyWorkerEarnings_ACC
    }

    totalLiableEarnings = calcTotalLiableEarningsEMPWPC(liableEarnings.TotalGrossEarnings,
        liableEarnings.TotalEarningsNotLiable,
        liableEarnings.TotalPAYE,
        liableEarnings.TotalExcessPaid,
        embassyWorkerEarnings,
        liableEarnings.PaymentToEmployees,
        liableEarnings.PaymentAfterFirstWeek,
        provisional,
        liableEarnings.ERAIndicator_ACC,
        liableEarnings.Branch.Policy.IsAEPMemberPolicy_ACC)

    if (totalLiableEarnings < MIN_DOLLAR_VALUE) {
      totalLiableEarnings = BigDecimal.ZERO
    } else if (totalLiableEarnings > MAX_DOLLAR_VALUE) {
      totalLiableEarnings = MAX_DOLLAR_VALUE
    }
    return totalLiableEarnings.setScale(2, RoundingMode.HALF_UP)
  }

  /**
   * From Story US126: (Net schedular payments + Total active partnership income + Adjusted LTC Income + Self-employed net income) – Expenses
   * From Story US228: (Net schedular payments + Total active partnership income + Adjusted LTC Income + Self-employed net income) – Expenses - earningNotLiableForACC
   *
   * @param netSchedularPayments
   * @param totalActivePartnershipIncome
   * @param adjustedLTCIncome
   * @param selfEmployedNetIncome
   * @param totalOtherExpensesClaimed
   * @param earningNotLiableForACC
   * @return (netSchedularPayments + totalActivePartnershipIncome + adjustedLTCIncome + selfEmployedNetIncome) - totalOtherExpensesClaimed - earningNotLiableForACC
   */
  private static function calcTotalLiableEarningsINDCoP(netSchedularPayments : BigDecimal,
                                                        totalActivePartnershipIncome : BigDecimal,
                                                        adjustedLTCIncome : BigDecimal,
                                                        selfEmployedNetIncome : BigDecimal,
                                                        totalOtherExpensesClaimed : BigDecimal,
                                                        overseasIncome : BigDecimal,
                                                        levyYear : int,
                                                        earningNotLiableForACC : BigDecimal = 0bd) : BigDecimal {
    var nonExpenses = (netSchedularPayments + totalActivePartnershipIncome + adjustedLTCIncome + selfEmployedNetIncome)

    if (FeatureToogleUtil.overseasIncomeEnabled(levyYear)) {
      nonExpenses += overseasIncome
    }

    if (nonExpenses.IsZero and !totalOtherExpensesClaimed.IsZero) {
      return BigDecimal.ZERO
    }
    var totalLiableEarnings = (netSchedularPayments + totalActivePartnershipIncome + adjustedLTCIncome + selfEmployedNetIncome) - totalOtherExpensesClaimed
        - (earningNotLiableForACC == null ? 0bd : earningNotLiableForACC)

    if (FeatureToogleUtil.overseasIncomeEnabled(levyYear)) {
      totalLiableEarnings += overseasIncome
    }

    return totalLiableEarnings
  }

  /**
   * From Story US127: (Total Gross Earnings and / or schedular payments - Total earnings not liable for AC Earners levy
   * - Total PAYE and/ or schedular tax - Total excess paid to employees over the maximum
   * - Payments to employees for the first week of injury - Payments after the first
   *
   * @param totalGrossEarnings
   * @param totalEarningsNotLiable
   * @param totalPAYE
   * @param totalExcessPaid
   * @param embassyWorkerEarnings
   * @param paymentsToEmployees
   * @param paymentsAfterFirstWeek
   * @return totalGrossEarnings - totalEarningsNotLiable - totalPAYE - totalExcessPaid - paymentsToEmployees - paymentsAfterFirstWeek
   */
  public static function calcTotalLiableEarningsEMPWPC(totalGrossEarnings: BigDecimal,
                                                       totalEarningsNotLiable: BigDecimal,
                                                       totalPAYE: BigDecimal,
                                                       totalExcessPaid: BigDecimal,
                                                       paymentsToEmployees: BigDecimal,
                                                       paymentsAfterFirstWeek: BigDecimal,
                                                       provisional: boolean,
                                                       eraIndicator: boolean,
                                                       isAEPMember: boolean): BigDecimal {
    var totalLiableEarnings = totalGrossEarnings - totalEarningsNotLiable - totalPAYE - totalExcessPaid
    // US1957 - exclude paymentsToEmployees and paymentsAfterFirstWeek for provisional
    if (!provisional) {
      totalLiableEarnings -= paymentsToEmployees
      if (isAEPMember == true or
          (isAEPMember == false and eraIndicator)) {
        totalLiableEarnings -= paymentsAfterFirstWeek
      }
    }

    return totalLiableEarnings
  }

  /**
   * From Story US127: (Total Gross Earnings and / or schedular payments - Total earnings not liable for AC Earners levy
   * - Total PAYE and/ or schedular tax - Total excess paid to employees over the maximum
   * - Payments to employees for the first week of injury - Payments after the first
   *
   * @param totalGrossEarnings
   * @param totalEarningsNotLiable
   * @param totalPAYE
   * @param totalExcessPaid
   * @param embassyWorkerEarnings
   * @param paymentsToEmployees
   * @param paymentsAfterFirstWeek
   * @return totalGrossEarnings - totalEarningsNotLiable - totalPAYE - totalExcessPaid - paymentsToEmployees - paymentsAfterFirstWeek
   */
  private static function calcTotalLiableEarningsEMPWPC(totalGrossEarnings: BigDecimal,
                                                        totalEarningsNotLiable: BigDecimal,
                                                        totalPAYE: BigDecimal,
                                                        totalExcessPaid: BigDecimal,
                                                        embassyWorkerEarnings: BigDecimal,
                                                        paymentsToEmployees: BigDecimal,
                                                        paymentsAfterFirstWeek: BigDecimal,
                                                        provisional: boolean,
                                                        eraIndicator: boolean,
                                                        isAEPMember: boolean): BigDecimal {
    var totalLiableEarnings = calcTotalLiableEarningsEMPWPC(totalGrossEarnings,
        totalEarningsNotLiable,
        totalPAYE,
        totalExcessPaid,
        paymentsToEmployees,
        paymentsAfterFirstWeek,
        provisional, eraIndicator,
        isAEPMember) - embassyWorkerEarnings
    return totalLiableEarnings
  }

  /**
   * For resetting the liable earnings on a Individual Cover Plus policy
   *
   * @param liableEarningsCov
   */
  public static function resetINDCoPLiableEarnings(liableEarningsCov: entity.INDLiableEarnings_ACC) {
    //will set liable earnings to 0 for it to be zero-rated
    liableEarningsCov.NetSchedulerPayments = ZERO_NZD
    liableEarningsCov.TotalActivePartnershipInc = ZERO_NZD
    liableEarningsCov.AdjustedLTCIncome = ZERO_NZD
    liableEarningsCov.SelfEmployedNetIncome = ZERO_NZD
    liableEarningsCov.TotalOtherExpensesClaimed = ZERO_NZD
    liableEarningsCov.TotalGrossIncome = ZERO_NZD
    liableEarningsCov.TotalIncomeNotLiable = ZERO_NZD
    liableEarningsCov.TotalShareholderEmplSalary = ZERO_NZD
    liableEarningsCov.TotalOtherNetIncome = ZERO_NZD
    liableEarningsCov.TotalOverseasIncome = ZERO_NZD
    liableEarningsCov.TotalLiableEarnings = ZERO_NZD
    liableEarningsCov.AdjustedLiableEarnings = ZERO_NZD
    liableEarningsCov.EarningNotLiable = ZERO_NZD
    liableEarningsCov.Branch.INDCoPLine.BICCodes.each(\eachBIC -> {
      eachBIC.AdjustedLiableEarnings = new CurrencyAmount(BigDecimal.ZERO, Currency.TC_NZD)
    })
  }

  /**
   * For resetting the liable earnings on a Employer Workplace Cover policy
   *
   * @param liableEarningsCov
   */
  static function resetEMPWPCLiableEarnings(liableEarningCov: EMPLiableEarnings_ACC) {
    //will set liable earnings to 0 for it to be zero-rated
    liableEarningCov.TotalGrossEarnings = ZERO_NZD
    liableEarningCov.TotalEarningsNotLiable = ZERO_NZD
    liableEarningCov.TotalPAYE = ZERO_NZD
    liableEarningCov.TotalExcessPaid = ZERO_NZD
    liableEarningCov.EmbassyWorkerEarnings_ACC = ZERO_NZD
    liableEarningCov.PaymentToEmployees = ZERO_NZD
    liableEarningCov.PaymentAfterFirstWeek = ZERO_NZD
    liableEarningCov.TotalLiableEarnings = ZERO_NZD
    liableEarningCov.AdjustedLiableEarnings = ZERO_NZD
    liableEarningCov.Branch.EMPWPCLine.BICCodes.each(\eachBIC -> {
      eachBIC.AdjustedLiableEarnings = new CurrencyAmount(BigDecimal.ZERO, Currency.TC_NZD)
    })
  }

  static function setEMPWPCLiableEarningsToZero(empCov: EMPWPCCov) {
    var liableEarningCov = empCov.LiableEarningCov
    liableEarningCov.TotalGrossEarnings = ZERO_NZD
    liableEarningCov.TotalEarningsNotLiable = ZERO_NZD
    liableEarningCov.TotalPAYE = ZERO_NZD
    liableEarningCov.TotalExcessPaid = ZERO_NZD
    liableEarningCov.EmbassyWorkerEarnings_ACC = ZERO_NZD
    liableEarningCov.PaymentToEmployees = ZERO_NZD
    liableEarningCov.PaymentAfterFirstWeek = ZERO_NZD
    liableEarningCov.TotalLiableEarnings = ZERO_NZD
    liableEarningCov.AdjustedLiableEarnings = ZERO_NZD
    empCov.calculateBICLiableEarnings()
  }

  static function setCWPSLiableEarningsToZero(wpsLine: CWPSLine) {
    // Set the remuneration for all policy shareholder earnings to zero and recalculate
    var shareholders = wpsLine.PolicyShareholders
    shareholders.each(\shareholder -> {
      var earnings = shareholder.ShareholderEarnings
      earnings.each(\earning -> {
        earning.Remuneration = ZERO_NZD
        earning.ExcessMax = ZERO_NZD
        earning.FirstWeek = ZERO_NZD
        earning.LiableEarnings = ZERO_NZD
        earning.AdjustedLiableEarnings = ZERO_NZD
        earning.AdjustedLELessCpx = ZERO_NZD
        earning.AuditAdjustedLELessCpx = ZERO_NZD
      })
    })
  }

  static function checkForNonZeroCWPSLiableEarnings(wpsLine: CWPSLine): boolean {

    if (wpsLine.PolicyShareholders.length == 0) {
      return false
    }
    // Set the remuneration for all policy shareholder earnings to zero and recalculate
    for (shareholder in wpsLine.PolicyShareholders.where(\elt -> elt.PolicyContact.Subtype == Contact.TC_PERSON)) {
      for (earning in shareholder.ShareholderEarnings) {
        if ((earning.Remuneration == null or earning.Remuneration.Amount == BigDecimal.ZERO) and
            (earning.ExcessMax == null or earning.ExcessMax.Amount == BigDecimal.ZERO) and
            (earning.FirstWeek == null or earning.FirstWeek.Amount == BigDecimal.ZERO) and
            (earning.LiableEarnings == null or earning.LiableEarnings.Amount == BigDecimal.ZERO) and
            (earning.AdjustedLiableEarnings == null or earning.AdjustedLiableEarnings.Amount == BigDecimal.ZERO) and
            (earning.AuditAdjustedLELessCpx == null or earning.AuditAdjustedLELessCpx.Amount == BigDecimal.ZERO)
            ) {
          // nothing to do
        } else {
          return true
        }
      }
    }

    return false
  }

  /**
   * For Copying the liable earnings on a Employer Workplace Cover policy
   *
   * @param liableEarningsCov
   */
  static function copyEMPWPCLiableEarnings(srcEMPCov: EMPWPCCov, destEMPCov: EMPWPCCov) {
    var srcLiableEarningCov = srcEMPCov.LiableEarningCov
    var destLiableEarningCov = destEMPCov.LiableEarningCov
    destLiableEarningCov.TotalGrossEarnings = srcLiableEarningCov.TotalGrossEarnings
    destLiableEarningCov.TotalEarningsNotLiable = srcLiableEarningCov.TotalEarningsNotLiable
    destLiableEarningCov.TotalPAYE = srcLiableEarningCov.TotalPAYE
    destLiableEarningCov.TotalExcessPaid = srcLiableEarningCov.TotalExcessPaid
    destLiableEarningCov.EmbassyWorkerEarnings_ACC = srcLiableEarningCov.EmbassyWorkerEarnings_ACC
    destLiableEarningCov.PaymentToEmployees = srcLiableEarningCov.PaymentToEmployees
    destLiableEarningCov.PaymentAfterFirstWeek = srcLiableEarningCov.PaymentAfterFirstWeek
    destLiableEarningCov.TotalLiableEarnings = srcLiableEarningCov.TotalLiableEarnings
    destLiableEarningCov.AdjustedLiableEarnings = srcLiableEarningCov.AdjustedLiableEarnings
    destLiableEarningCov.Branch.EMPWPCLine.BICCodes = {}
    srcLiableEarningCov.Branch.EMPWPCLine.BICCodes.each(\bicCode -> {
      var destPolLine = destLiableEarningCov.Branch.EMPWPCLine
      var bic = new PolicyLineBusinessClassificationUnit_ACC(destPolLine.Branch, destPolLine.EffectiveDate, destPolLine.ExpirationDate)
      bic.CUCode = bicCode.CUCode
      bic.CUDescription = bicCode.CUDescription
      bic.BICCode = bicCode.BICCode
      bic.BICDescription = bicCode.BICDescription
      bic.Percentage = bicCode.Percentage
      bic.AdjustedLiableEarnings = bicCode.AdjustedLiableEarnings
      destPolLine.addToBICCodes(bic)
    })
    destEMPCov.calculateBICLiableEarnings()
  }

  static function copyCWPSBICCodes(srcPolicyPeriod: PolicyPeriod, destPolicyPeriod: PolicyPeriod) {
    //Copy BIC Codes
    destPolicyPeriod.CWPSLine.BICCodes = {}
    srcPolicyPeriod.CWPSLine.BICCodes.each(\bicCode -> {
      var destPolLine = destPolicyPeriod.CWPSLine
      var destBIC = new PolicyLineBusinessClassificationUnit_ACC(destPolLine.Branch, destPolLine.EffectiveDate, destPolLine.ExpirationDate)
      destPolLine.addToBICCodes(destBIC)
      destBIC.CUCode = bicCode.CUCode
      destBIC.CUDescription = bicCode.CUDescription
      destBIC.BICCode = bicCode.BICCode
      destBIC.BICDescription = bicCode.BICDescription
      if (bicCode.isPrimary()) {
        destBIC.setAsPrimary()
      }
    })
  }

  static function copyCWPSPolicyShareholders(srcPolicyPeriod: PolicyPeriod, destPolicyPeriod: PolicyPeriod) {
    destPolicyPeriod.CWPSLine.PolicyShareholders = {}

    //Copy ShareHolders

    srcPolicyPeriod.CWPSLine.PolicyShareholders.each(\shareHolder -> {

      var newShareholder = destPolicyPeriod.CWPSLine.addNewPolicyShareholderForContact(shareHolder.ContactDenorm)

      // iterate through source shareholder earnings
      for (srcShareholderEarnings in shareHolder.ShareholderEarnings index i) {
        var shareholderEarnings: ShareholderEarnings_ACC
        if (i == 0) {
          // use the first new shareholder earning already created
          shareholderEarnings = newShareholder.ShareholderEarnings.first()
        } else {
          // create a new shareholder earning
          shareholderEarnings = new ShareholderEarnings_ACC(destPolicyPeriod)
          shareholderEarnings.initializeFields()
          newShareholder.addToShareholderEarnings(shareholderEarnings)
        }
        shareholderEarnings.setRemuneration(new MonetaryAmount(srcShareholderEarnings.Remuneration, Currency.TC_NZD))
        shareholderEarnings.computeShareholderEarnings()
        shareholderEarnings.setCUCode(srcShareholderEarnings.CUCode)
      }
      destPolicyPeriod.CWPSLine.addToPolicyShareholders(newShareholder)
    })
  }

  static function checkForPreviousERA_ACC(liableEarnings: EMPLiableEarnings_ACC) {
    if (!liableEarnings.isFieldChanged("ERAIndicator_ACC")) {
      liableEarnings.ERAChangedDate_ACC = null
    }
    if (liableEarnings.isFieldChanged("ERAIndicator_ACC") and
        ((liableEarnings.BasedOn != null and liableEarnings.BasedOn.ERAIndicator_ACC and !liableEarnings.ERAIndicator_ACC) ||
            (liableEarnings.BasedOn != null and !liableEarnings.BasedOn.ERAIndicator_ACC and liableEarnings.ERAIndicator_ACC))) {
      liableEarnings.ERAChangedDate_ACC = Date.Now
    }


    //Setting the ERA Contract Number to null if the ERA Indicator is unchecked.
    if (!liableEarnings.ERAIndicator_ACC) {
      liableEarnings.ERAContractNumber_ACC = null
    }
  }

  static function checkEmbassyWorker(liableEarnings: EMPLiableEarnings_ACC) {
    //Setting the Embassy Worker earnings to zero if the Embassy Worker checkbox is unchecked.
    if (!liableEarnings.EmbassyWorker_ACC) {
      liableEarnings.EmbassyWorkerEarnings_ACC = ZERO_NZD
    } else {
      //Setting the Embassy Worker earnings to the total liable earnings if the Embassy Worker checkbox is checked.
      liableEarnings.EmbassyWorkerEarnings_ACC = liableEarnings.TotalLiableEarnings
    }
  }

  static function setCUCode(bicCodes: PolicyLineBusinessClassificationUnit_ACC[], periodStart: Date, periodEnd: Date):boolean {
    var defaultCUApplied = false
    if (bicCodes != null) {
      bicCodes.each(\bicCode -> {
        // Migrated data will initially have BIC Code = null
        // in that case, no point looking up the CU code associated with the BIC Code
        // However data that was originally migrated may later be updated to have a BIC Code
        // hence why we are not checking the migrated flag
        var classificationUnit: ClassificationUnit_ACC = null
        var bicCodeNotFound = false
        if (bicCode.BICCode != null) {
          //Checking the DB if the CU Code is changed
          var query = Query.make(BusinessIndustryCode_ACC)
          query.compare("BusinessIndustryCode", Relop.Equals, bicCode.BICCode)
          query.compare("StartDate", Relop.LessThanOrEquals, periodStart)
          query.compare("EndDate", Relop.GreaterThanOrEquals, periodEnd)
          var dbCUCode = query.select().first()
          if (dbCUCode == null) {
            bicCodeNotFound = true
          }

          if (bicCode.CUCode != null and dbCUCode == null) {
            classificationUnit = QueryClassificationUnit(bicCode.CUCode, periodStart, periodEnd)
          } else {
            classificationUnit = dbCUCode.ClassificationUnit_ACC
          }
        } else {
          classificationUnit = QueryClassificationUnit(bicCode.CUCode, periodStart, periodEnd)
        }

        if (classificationUnit == null) {
          var defaultBICCodeVal = ScriptParameters.BICCodeNonRuralDefault_ACC
          var defaultBICCode = QueryBICCode(defaultBICCodeVal, "BusinessIndustryCode", periodStart, periodEnd)
          bicCode.BICCode = defaultBICCode.BusinessIndustryCode
          bicCode.BICDescription = defaultBICCode.BusinessIndustryDescription
          setBICCUInformation(bicCode, defaultBICCode.ClassificationUnit_ACC)
          defaultCUApplied = true
        } else if (bicCodeNotFound) {
          bicCode.BICCode = ""
          bicCode.BICDescription = ""
          setBICCUInformation(bicCode, classificationUnit)
        }
        // Do this only when the CU Code is changed
        else if (classificationUnit.ClassificationUnitCode != bicCode.CUCode) {
          setBICCUInformation(bicCode, classificationUnit)
        }
      })
    }
    return defaultCUApplied
  }

  static function setBICCUInformation(bicCode: PolicyLineBusinessClassificationUnit_ACC, classificationUnit: ClassificationUnit_ACC) {
    bicCode.CUCode = classificationUnit.ClassificationUnitCode
    bicCode.CUDescription = classificationUnit.ClassificationUnitDescription
    bicCode.ReplacementLabourCost = classificationUnit.ReplacementLabourCost

    // Update the CU Code of the Shareholder with the updated CU
    if (bicCode.PolicyLineRef typeis entity.CWPSLine) {
      CWPSUIUtil_ACC.updateCWPSShareholderClassificationUnits(bicCode, bicCode.PolicyLineRef)
    }
  }

  static function QueryBICCode(bicFieldValue: String, bicFieldName: String, periodStart: Date, periodEnd: Date): BusinessIndustryCode_ACC {
    //Checking the DB if the CU Code is changed
    var query = Query.make(BusinessIndustryCode_ACC)
    query.compare(bicFieldName, Relop.Equals, bicFieldValue)
    query.compare("StartDate", Relop.LessThanOrEquals, periodStart)
    query.compare("EndDate", Relop.GreaterThanOrEquals, periodEnd)
    return query.select().AtMostOneRow
  }

  static function QueryClassificationUnit(cuFieldValue: String, periodStart: Date, periodEnd: Date): ClassificationUnit_ACC {
    //Checking the DB if the CU Code is changed
    var query = Query.make(ClassificationUnit_ACC)
    query.compare("ClassificationUnitCode", Relop.Equals, cuFieldValue)
    query.compare("StartDate", Relop.LessThanOrEquals, periodStart)
    query.compare("EndDate", Relop.GreaterThanOrEquals, periodEnd)
    return query.select().AtMostOneRow
  }

  private static function logDebug(fn: String, msg: String) {
    _logger.debug(msg)
  }
}
