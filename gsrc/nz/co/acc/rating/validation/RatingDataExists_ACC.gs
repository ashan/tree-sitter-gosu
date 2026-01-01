package nz.co.acc.rating.validation

uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.rating.rtm.domain.ErrorCollector
uses gw.rating.rtm.domain.table.RateTableRow
uses gw.util.Pair

/**
 * Verify that the main CU table i.e ClassificationUnit_ACC entity data is in the rate table.
 */
class RatingDataExists_ACC extends ValidationRule_ACC {
  private var mainClassificationUnits : List<CUData_ACC> = null

  construct(rateTableName : String, rateTableValidator : RateTableValidator_ACC, collector: ErrorCollector, levyYear : Pair<Date, Date>) {
    super(collector)
    // lazy load the cu codes from the main table
    if (mainClassificationUnits == null) {
      mainClassificationUnits = new ArrayList<CUData_ACC>()
      var classificationUnits : List<ClassificationUnit_ACC> = null
      // The Work Residual Levy expired on 01/04/2016 so don't load these CU's
      if (rateTableName.startsWith(rateTableValidator.WORK_RESIDUAL_LEVY_RATE_TABLE_NAME)) {
        // only load the CU's before the levy's end date
        var accWorkResidualLevyEndDate = (ScriptParameters.getParameterValue("ACCWorkResidualLevyEndDate") as Date)
        if (levyYear.Second.equals(accWorkResidualLevyEndDate) or levyYear.Second.before(accWorkResidualLevyEndDate)) {
          classificationUnits = findClassificationUnitsForLevyYear(levyYear.First, levyYear.Second)
        } else {
          // Display an error and stop the loading of rate book after 2015/2016.
          throw new DisplayableException(DisplayKey.get("Web.Rating_ACC.RateTables.WorkResidualRateTableLoadAfterEnd", accWorkResidualLevyEndDate.ShortFormat))
        }
      } else {
        // load 'em all
        classificationUnits = findClassificationUnitsForLevyYear(levyYear.First, levyYear.Second)
      }
      if (classificationUnits != null) {
        for (classificationUnit in classificationUnits) {
          // create CU data
          var cuData = new CUData_ACC(classificationUnit.StartDate, classificationUnit.EndDate, classificationUnit.ClassificationUnitCode)
          mainClassificationUnits.add(cuData)
        }
      }
    }
  }

  public function resetMainClassificationUnits() {
    mainClassificationUnits = null
  }

  public function classificationUnitsNotInRateTableExist() : boolean {
    return mainClassificationUnits != null and mainClassificationUnits.size() > 0
  }

  public function getMissingCUCodes() : List<CUData_ACC> {
    return mainClassificationUnits
  }

  override function visit(ratingRow: RateTableRow) {
    var row = ratingRow.Row
    var cuCode = row.getFieldValue(CLASSIFICATION_UNIT_CODE_KEY) as String
    var startDate = row.getFieldValue(START_DATE_KEY) as Date
    var endDate = row.getFieldValue(END_DATE_KEY) as Date
    var cuData = new CUData_ACC(startDate, endDate, cuCode)
    // remove from the main CU list
    mainClassificationUnits.remove(cuData)
  }
}