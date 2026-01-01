package nz.co.acc.lob.util

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.pl.currency.MonetaryAmount
uses gw.pl.persistence.core.Bean
uses nz.co.acc.lob.common.DateUtil_ACC

/**
 * Utility class for the ACC admin screens.
 */
class AdminUtil_ACC {

  public static function deleteMinMaxEarning(minMaxEarning: EarningsMinMaxData_ACC) {
    var bundle = gw.transaction.Transaction.getCurrent()
    var minMaxEarningNew =  bundle.loadBean(minMaxEarning.ID)
    bundle.delete(minMaxEarningNew)
    bundle.commit()
  }

  public static function deleteInflationAdjustment(inflationAdjustment: InflationAdjustment_ACC) {
    var bundle = gw.transaction.Transaction.getCurrent()
    var inflationAdjustmentNew =  bundle.loadBean(inflationAdjustment.ID)
    bundle.delete(inflationAdjustmentNew)
    bundle.commit()
  }

  public static function deleteMinMaxEarnings(minMaxEarnings: EarningsMinMaxData_ACC[]) {
    var bundle = gw.transaction.Transaction.getCurrent()

    for (var minMaxEarning in minMaxEarnings) {
      var minMaxEarningNew =  bundle.loadBean(minMaxEarning.ID)
      bundle.delete(minMaxEarningNew)
    }
    bundle.commit();
  }

  public static function deleteBusinessIndustryCodes(businessIndustryCodes: BusinessIndustryCode_ACC[]) {
    gw.transaction.Transaction.runWithNewBundle(\bundle -> {
      for (var bic in businessIndustryCodes) {
        var bicNew =  bundle.add(bic)
        bundle.delete(bicNew)
      }
    })
  }

  public static function deleteClassificationUnits(classificationUnits: ClassificationUnit_ACC[]) {
    checkForChildBusinessIndustryCodes(classificationUnits)
    checkForCURatesInTheRateBook(classificationUnits)
    gw.transaction.Transaction.runWithNewBundle(\bundle -> {
      for (var cu in classificationUnits) {
        var cuNew = bundle.add(cu)
        bundle.delete(cuNew)
      }
    })
  }

  private static function checkForCURatesInTheRateBook(classificationUnits: ClassificationUnit_ACC[]) {
    // Check that no rates exist in the ratebook for the classification units being deleted. If so then display error.
    var cuErrors = new HashSet<String>()
    for (classificationUnit in classificationUnits) {
      // Work Account Levy
      var workAccountLevyRateQuery = Query.make(WorkAccountLevyRate_ACC)
      workAccountLevyRateQuery.compare(WorkAccountLevyRate_ACC#ClassificationUnitCode, Equals, classificationUnit.ClassificationUnitCode)
      workAccountLevyRateQuery.compare(WorkAccountLevyRate_ACC#StartDate, Equals, classificationUnit.StartDate)
      workAccountLevyRateQuery.compare(WorkAccountLevyRate_ACC#EndDate, Equals, classificationUnit.EndDate)
      var workAccountLevyRateResult = workAccountLevyRateQuery.select()
      if (workAccountLevyRateResult.HasElements) {
        var cuMessage = "CU: " + classificationUnit.ClassificationUnitCode + " | Start Date: " + classificationUnit.StartDate.ShortFormat + " | End Date: " + classificationUnit.EndDate.ShortFormat
        cuErrors.add(WorkAccountLevyRate_ACC.TYPE.Name + " has the following classification unit: " + cuMessage)
      }
      // Work Residual Levy
      var workResidualLevyRateQuery = Query.make(WorkResidualLevyRate_ACC)
      workResidualLevyRateQuery.compare(WorkResidualLevyRate_ACC#ClassificationUnitCode, Equals, classificationUnit.ClassificationUnitCode)
      workResidualLevyRateQuery.compare(WorkResidualLevyRate_ACC#StartDate, Equals, classificationUnit.StartDate)
      workResidualLevyRateQuery.compare(WorkResidualLevyRate_ACC#EndDate, Equals, classificationUnit.EndDate)
      var workResidualLevyRateResult = workResidualLevyRateQuery.select()
      if (workResidualLevyRateResult.HasElements) {
        var cuMessage = "CU: " + classificationUnit.ClassificationUnitCode + " | Start Date: " + classificationUnit.StartDate.ShortFormat + " | End Date: " + classificationUnit.EndDate.ShortFormat
        cuErrors.add(WorkResidualLevyRate_ACC.TYPE.Name + " has the following classification unit: " + cuMessage)
      }
      // CPX Work Levy
      var cpxWorkLevyRateQuery = Query.make(CPXWorkLevyRate_ACC)
      cpxWorkLevyRateQuery.compare(CPXWorkLevyRate_ACC#ClassificationUnitCode, Equals, classificationUnit.ClassificationUnitCode)
      cpxWorkLevyRateQuery.compare(CPXWorkLevyRate_ACC#StartDate, Equals, classificationUnit.StartDate)
      cpxWorkLevyRateQuery.compare(CPXWorkLevyRate_ACC#EndDate, Equals, classificationUnit.EndDate)
      var cpxWorkLevyRateResult = cpxWorkLevyRateQuery.select()
      if (cpxWorkLevyRateResult.HasElements) {
        var cuMessage = "CU: " + classificationUnit.ClassificationUnitCode + " | Start Date: " + classificationUnit.StartDate.ShortFormat + " | End Date: " + classificationUnit.EndDate.ShortFormat
        cuErrors.add(CPXWorkLevyRate_ACC.TYPE.Name + " has the following classification unit: " + cuMessage)
      }
      // AEP Partnership Discount Levy
      var aepPartnershipDiscountLevyRateQuery = Query.make(AEPPartnershipDiscLevyRate_ACC)
      aepPartnershipDiscountLevyRateQuery.compare(AEPPartnershipDiscLevyRate_ACC#ClassificationUnitCode, Equals, classificationUnit.ClassificationUnitCode)
      aepPartnershipDiscountLevyRateQuery.compare(AEPPartnershipDiscLevyRate_ACC#StartDate, Equals, classificationUnit.StartDate)
      aepPartnershipDiscountLevyRateQuery.compare(AEPPartnershipDiscLevyRate_ACC#EndDate, Equals, classificationUnit.EndDate)
      var aepPartnershipDiscountRateResult = aepPartnershipDiscountLevyRateQuery.select()
      if (aepPartnershipDiscountRateResult.HasElements) {
        var cuMessage = "CU: " + classificationUnit.ClassificationUnitCode + " | Start Date: " + classificationUnit.StartDate.ShortFormat + " | End Date: " + classificationUnit.EndDate.ShortFormat
        cuErrors.add(AEPPartnershipDiscLevyRate_ACC.TYPE.Name + " has the following classification unit: " + cuMessage)
      }
    }
    if (!cuErrors.isEmpty()) {
      // display error message
      throw new DisplayableException(DisplayKey.get("Web.Admin_ACC.BusinessIndustryCode_ClassificationUnit_Data.RateExistsForCU", cuErrors.toString()))
    }
  }

  private static function checkForChildBusinessIndustryCodes(classificationUnits: ClassificationUnit_ACC[]) {
    // Check that no BIC's exist for the classification units being deleted. If so then display error.
    var cuErrors = new HashSet<String>()
    for (classificationUnit in classificationUnits) {
      var query = Query.make(BusinessIndustryCode_ACC)
      query.join(BusinessIndustryCode_ACC#ClassificationUnit_ACC).compare(ClassificationUnit_ACC#ClassificationUnitCode, Relop.Equals, classificationUnit.ClassificationUnitCode)
      query.compare(BusinessIndustryCode_ACC#StartDate, Equals, classificationUnit.StartDate)
      query.compare(BusinessIndustryCode_ACC#EndDate, Equals, classificationUnit.EndDate)
      var result = query.select()
      if (result.HasElements) {
        cuErrors.add("CU: " + classificationUnit.ClassificationUnitCode + " | Start Date: " + classificationUnit.StartDate.ShortFormat + " | End Date: " + classificationUnit.EndDate.ShortFormat)
      }
    }
    if (!cuErrors.isEmpty()) {
      // display error message
      throw new DisplayableException(DisplayKey.get("Web.Admin_ACC.BusinessIndustryCode_ClassificationUnit_Data.BICExistsForCU", cuErrors.toString()))
    }
  }

  public static function deleteInflationAdjustments(inflationAdjustments: InflationAdjustment_ACC[]) {
    var bundle = gw.transaction.Transaction.getCurrent()

    for (var inflationAdjustment in inflationAdjustments) {
      var inflationAdjustmentNew =  bundle.loadBean(inflationAdjustment.ID)
      bundle.delete(inflationAdjustmentNew)
    }
    bundle.commit();
  }

  public static function findClassificationUnit(classificationUnitCode : String, startDate : Date, endDate : Date) : ClassificationUnit_ACC {
    var query = Query.make(ClassificationUnit_ACC)
    query.compare(ClassificationUnit_ACC#ClassificationUnitCode, Equals, classificationUnitCode)
    query.compare(ClassificationUnit_ACC#StartDate, Equals, startDate)
    query.compare(ClassificationUnit_ACC#EndDate, Equals, endDate)
    var result = query.select().AtMostOneRow
    return result
  }

  public static function findBusinessIndustryCode(businessIndustryCode : String, startDate : Date, endDate : Date) : BusinessIndustryCode_ACC {
    var query = Query.make(BusinessIndustryCode_ACC)
    query.compare(BusinessIndustryCode_ACC#BusinessIndustryCode, Equals, businessIndustryCode)
    query.compare(BusinessIndustryCode_ACC#StartDate, Equals, startDate)
    query.compare(BusinessIndustryCode_ACC#EndDate, Equals, endDate)
    var result = query.select().AtMostOneRow
    return result
  }

  public static function findInflationRate(startDate : Date, endDate : Date) : InflationAdjustment_ACC {
    var query = Query.make(InflationAdjustment_ACC)
    query.compare(InflationAdjustment_ACC#PolicyStartDate, Equals, startDate)
    query.compare(InflationAdjustment_ACC#PolicyEndDate, Equals, endDate)
    var result = query.select().AtMostOneRow
    return result
  }

  public static function findMinMaxEntry(startDate : Date, endDate : Date) : EarningsMinMaxData_ACC {
    var query = Query.make(EarningsMinMaxData_ACC)
    query.compare(EarningsMinMaxData_ACC#PolicyStartDate, Equals, startDate)
    query.compare(EarningsMinMaxData_ACC#PolicyEndDate, Equals, endDate)
    var result = query.select().AtMostOneRow
    return result
  }

  public static function getBusinessIndustryCodes() : gw.api.database.IQueryBeanResult<BusinessIndustryCode_ACC> {
    return Query.make(BusinessIndustryCode_ACC).select()

  }

  public static function getClassificationUnits() : gw.api.database.IQueryBeanResult<ClassificationUnit_ACC> {
    return Query.make(ClassificationUnit_ACC).select()
  }
  public static function getMinMaxEarnings() : gw.api.database.IQueryBeanResult<EarningsMinMaxData_ACC> {
    return gw.api.database.Query.make(EarningsMinMaxData_ACC).select()
  }

  public static function getInflationAdjustments() : gw.api.database.IQueryBeanResult<InflationAdjustment_ACC> {
    return Query.make(InflationAdjustment_ACC).select()
  }

  public static function validateCPFullTimeMaximum(minimumAmt: MonetaryAmount, maximumAmt: MonetaryAmount) : String {
    var message : String = null
    if (maximumAmt.Amount < minimumAmt.Amount) {
      message = DisplayKey.get("Web.Admin_ACC.MinMaxEarnings.Validation.MaxLessThanMin")
    }
    return message
  }

  public static function validateCPXFullTimeMaximum(minimumAmt: MonetaryAmount, maximumAmt: MonetaryAmount) : String {
    var message : String = null
    if (maximumAmt.Amount < minimumAmt.Amount) {
      message = DisplayKey.get("Web.Admin_ACC.MinMaxEarnings.Validation.MaxLessThanMin")
    }
    return message
  }

  public static function validateClassificationUnitStartDate(startDate : Date, rowNumber : Integer) : String {
    var message : String = null
    if (!DateUtil_ACC.isSpecificDate(startDate, 1, 4)) {
      message = DisplayKey.get("Web.Admin_ACC.BusinessIndustryCode_ClassificationUnit_Data.StartDateNot1stApril", DateUtil_ACC.createDateAsString(startDate, "dd/MM/yyyy"), rowNumber)
    }
    return message
  }

  public static function validateClassificationUnitEndDate(endDate : Date, rowNumber : Integer) : String {
    var message : String = null
    if (!DateUtil_ACC.isSpecificDate(endDate, 1, 4)) {
      message = DisplayKey.get("Web.Admin_ACC.BusinessIndustryCode_ClassificationUnit_Data.EndDateNot1stApril", DateUtil_ACC.createDateAsString(endDate, "dd/MM/yyyy"), rowNumber)
    }
    return message
  }

  public static function validateMinMaxInflationRateEndDate(endDate : Date, rowNumber : Integer) : String {
    var message : String = null
    if (!DateUtil_ACC.isSpecificDate(endDate, 31, 3)) {
      message = DisplayKey.get("Web.Admin_ACC.BusinessIndustryCode_ClassificationUnit_Data.EndDateNot31stMarch", DateUtil_ACC.createDateAsString(endDate, "dd/MM/yyyy"), rowNumber)
    }
    return message
  }

  public static function validateClassificationUnitEndDateOneYearAfterStartDate(startDate : Date, endDate : Date, rowNumber : Integer) : String {
    var message : String = null
    var endDateYear = endDate.YearOfDate
    var startDateYear = startDate.YearOfDate
    if (endDateYear - startDateYear != 1) {
      message = DisplayKey.get("Web.Admin_ACC.BusinessIndustryCode_ClassificationUnit_Data.EndDateNotOneYearAfterStartDate", DateUtil_ACC.createDateAsString(endDate, "dd/MM/yyyy"), DateUtil_ACC.createDateAsString(startDate, "dd/MM/yyyy"), rowNumber)
    }
    return message
  }

  public static function validateClassificationUnitEndDateAfterStartDate(startDate : Date, endDate : Date) : String {
    var message : String = null
    if (startDate != null and endDate != null) {
      var endDateYear = endDate.YearOfDate
      var startDateYear = startDate.YearOfDate
      if (endDateYear - startDateYear <= 0) {
        message = DisplayKey.get("Web.Admin_ACC.BusinessIndustryCode_ClassificationUnit_Data.EndDateNotAfterStartDate", DateUtil_ACC.createDateAsString(endDate, "dd/MM/yyyy"), DateUtil_ACC.createDateAsString(startDate, "dd/MM/yyyy"))
      }
    }
    return message
  }

  public static function validateINDPolicyEndDate(policyStartDate: Date, policyEndDate: Date) : String {
    var message : String = null
    // Policy end date has to be 31st March
    if (!DateUtil_ACC.isSpecificDate(policyEndDate, 31, 3)) {
      message = DisplayKey.get("Web.Admin_ACC.MinMaxEarnings.Validation.PolicyEndDateNot31stMarch")
    }
    // Policy end date has to be in the same levy year
    if ((message == null or message.equals("")) and policyStartDate != null) {
      if (!isEndDateYearOneYearAfterStartDateYear(policyStartDate, policyEndDate)) {
        message = DisplayKey.get("Web.Admin_ACC.MinMaxEarnings.Validation.PolicyEndDateMustBeInSameLevyYear")
      }
    }
    if (message == null or message.equals("")) {
      message = validateCoverPlusPolicyDate(policyEndDate)
    }
    return message
  }

  public static function validateINDPolicyStartDate(policyStartDate: Date) : String {
    var message : String = null
    // Policy start date has to be 1st April
    if (!DateUtil_ACC.isSpecificDate(policyStartDate, 1, 4)) {
      message = DisplayKey.get("Web.Admin_ACC.MinMaxEarnings.Validation.PolicyStartDateNot1stApril")
    }
    if (message == null or message.equals("")) {
      message = validateCoverPlusPolicyDate(policyStartDate)
    }
    return message
  }

  private static function isEndDateYearOneYearAfterStartDateYear(policyStartDate : Date, policyEndDate : Date) : boolean {
    var policyStartDateYear = policyStartDate.YearOfDate
    var policyEndDateYear = policyEndDate.YearOfDate
    return policyEndDateYear - policyStartDateYear == 1
  }

  private static function isWithinDateRange(dateToValidate : Date, policyStartDate : Date, policyEndDate : Date) : boolean {
    // use epoch milliseconds - if date to validate is between (inclusive) the date range then return true
    var dateToValidateLong = dateToValidate.Time
    var policyStartDateLong = policyStartDate.Time
    var policyEndDateLong = policyEndDate.Time
    return dateToValidateLong >= policyStartDateLong and dateToValidateLong <= policyEndDateLong
  }

  public static function validateCoverPlusPolicyDate(dateToValidate : Date) : String {
    var message : String = null
    var minMaxEarnings = getMinMaxEarnings()
    // check no overlap with the current earnings
    var overlap : boolean = false
    var overlappedMinMaxEarning : EarningsMinMaxData_ACC = null
    for (var minMaxEarning in minMaxEarnings) {
      var policyStartDate = minMaxEarning.PolicyStartDate
      var policyEndDate = minMaxEarning.PolicyEndDate
      if (isWithinDateRange(dateToValidate, policyStartDate, policyEndDate)) {
        overlap = true
        overlappedMinMaxEarning = minMaxEarning
      }
    }
    if (overlap and overlappedMinMaxEarning != null) {
      message = DisplayKey.get("Web.Admin_ACC.MinMaxEarnings.Validation.PolicyDatesOverlap",
          dateToValidate.ShortFormat, overlappedMinMaxEarning.PolicyStartDate.ShortFormat, overlappedMinMaxEarning.PolicyEndDate.ShortFormat)
    }
    return message
  }

  public static function validateInflationAdjustmentPolicyEndDate(policyStartDate: Date, policyEndDate: Date) : String {
    var message : String = null
    // Policy end date has to be 31st March
    if (!DateUtil_ACC.isSpecificDate(policyEndDate, 31, 3)) {
      message = DisplayKey.get("Web.Admin_ACC.MinMaxEarnings.Validation.PolicyEndDateNot31stMarch")
    }
    // Policy end date has to be in the same levy year
    if ((message == null or message.equals("")) and policyStartDate != null) {
      if (!isEndDateYearOneYearAfterStartDateYear(policyStartDate, policyEndDate)) {
        message = DisplayKey.get("Web.Admin_ACC.MinMaxEarnings.Validation.PolicyEndDateMustBeInSameLevyYear")
      }
    }
    if (message == null or message.equals("")) {
      message = validateInflationAdjustmentPolicyDate(policyEndDate)
    }
    return message
  }

  public static function validateInflationAdjustmentPolicyStartDate(policyStartDate: Date) : String {
    var message : String = null
    // Policy start date has to be 1st April
    if (!DateUtil_ACC.isSpecificDate(policyStartDate, 1, 4)) {
      message = DisplayKey.get("Web.Admin_ACC.MinMaxEarnings.Validation.PolicyStartDateNot1stApril")
    }
    if (message == null or message.equals("")) {
      message = validateInflationAdjustmentPolicyDate(policyStartDate)
    }
    return message
  }

  public static function validateInflationAdjustmentPolicyDate(dateToValidate: Date) : String {
    var message : String = null
    var inflationAdjustments = getInflationAdjustments()
    // check no overlap with the inflation adjustments
    var overlap : boolean = false
    var overlappedInflationAdjustment : InflationAdjustment_ACC = null
    for (var inflationAdjustment in inflationAdjustments) {
      var policyStartDate = inflationAdjustment.PolicyStartDate
      var policyEndDate = inflationAdjustment.PolicyEndDate
      if (isWithinDateRange(dateToValidate, policyStartDate, policyEndDate)) {
        overlap = true
        overlappedInflationAdjustment = inflationAdjustment
      }
    }
    if (overlap and overlappedInflationAdjustment != null) {
      message = DisplayKey.get("Web.Admin_ACC.MinMaxEarnings.Validation.PolicyDatesOverlap",
          dateToValidate.ShortFormat, overlappedInflationAdjustment.PolicyStartDate.ShortFormat, overlappedInflationAdjustment.PolicyEndDate.ShortFormat)
    }
    return message
  }
}
