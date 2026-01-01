package nz.co.acc.rating.validation

uses gw.api.locale.DisplayKey
uses gw.api.validation.EntityValidationException
uses gw.rating.rtm.domain.ErrorCollector
uses gw.rating.rtm.domain.table.RateTableModel
uses gw.rating.rtm.validation.RateTableValidator
uses gw.validation.PCValidationResult

/**
 * Validate the rate book.
 */
class RateTableValidator_ACC extends RateTableValidator {
  public final var WORK_ACCOUNT_LEVY_RATE_TABLE_NAME : String = "WorkAccountLevyRateTable"
  public final var WORK_RESIDUAL_LEVY_RATE_TABLE_NAME : String = "WorkResidualLevyRateTable"
  public final var CPX_LEVY_RATE_TABLE_NAME : String ="CPXWorkLevyRateTable"
  public final var AEP_PDP_RATE_TABLE_NAME : String = "PartnershipDiscountProgrammeLevyRateTable"


  private function validateNegativeFactors(model : RateTableModel, errorCollector: ErrorCollector) {
    var minimumValidator = new NegativeFactorValueVisitor_ACC(errorCollector)
    model.accept(minimumValidator)
  }

  private function validateNullParameters(model : RateTableModel, errorCollector: ErrorCollector) {
    var nullParameterValidator = new NullParameterValueVisitor_ACC(errorCollector)
    model.accept(nullParameterValidator)
  }

  /**
   * Validate that the CU's in the master CU table exist in the rate book for the specific levy year
   * @param model
   * @param errorCollector
   */
  function validate(model : RateTableModel, errorCollector: ErrorCollector) {
    // call the original validation
    super.validate(model, errorCollector)

    //Validate the parameters - none can be null
    validateNullParameters(model, errorCollector);

    //Validate all factors - none can be negative
    validateNegativeFactors(model, errorCollector);

    //Validate rate factors - check upper limit for rate factor values
    validateMaxRateFactorVals(model, errorCollector)

    var result = new PCValidationResult()

    // Validate that the CU's in the master CU table exist in the rate book for the specific levy year
    // Only validate CU for Work Account Levy and Work Residual Levy
    var rateTableName = model.RateTable.DisplayName
    if (rateTableName.startsWith(WORK_ACCOUNT_LEVY_RATE_TABLE_NAME) or
        rateTableName.startsWith(WORK_RESIDUAL_LEVY_RATE_TABLE_NAME) or
        rateTableName.startsWith(CPX_LEVY_RATE_TABLE_NAME) or
        rateTableName.startsWith(AEP_PDP_RATE_TABLE_NAME)) {

      //US4644 - for these tables only one year's rates may be imported at a time.
      var oneYearRates = new OneYearOfRatesValidator_ACC(errorCollector, result, model)
      model.accept(oneYearRates)
      if (oneYearRates.moreThanOneYearsRates()) {
        result.addError(model.RateTable, ValidationLevel.TC_DEFAULT,
            DisplayKey.get("Web.Rating_ACC.RateTables.MoreThanOneYearsRates"))
      }
      // If there are any errors at this stage report them and do not do the next validation
      checkErrors(errorCollector, result, model)

      // Validate that the CU's have data in them i.e. are not null or blank
      var cuCodeValid = new CUCodeValidator_ACC(errorCollector, result, model)
      model.accept(cuCodeValid)
      // If there are any errors at this stage report them and do not do the next validation as this will fail with null or blank CU's
      checkErrors(errorCollector, result, model)

      var ratingDataExists = new RatingDataExists_ACC(rateTableName, this, errorCollector, oneYearRates.validatedLevyYear())
      model.accept(ratingDataExists)
      // if any rows are left over - error
      if (ratingDataExists.classificationUnitsNotInRateTableExist()) {
        var missingCUCodes = ratingDataExists.getMissingCUCodes()
        if (missingCUCodes != null) {
          for (cuData in missingCUCodes) {
            result.addError(model.RateTable, ValidationLevel.TC_DEFAULT,
                DisplayKey.get("Web.Rating_ACC.RateTables.ClassificationUnitNotFoundInRateTable", cuData.CUCode, cuData.StartDate.ShortFormat, cuData.EndDate.ShortFormat))
          }
        }
      }
      //reset the main CU data
      ratingDataExists.resetMainClassificationUnits()
    }

    checkErrors(errorCollector, result, model)
  }

  private function validateMaxRateFactorVals(model: RateTableModel, errorCollector: ErrorCollector) {
    //DE294 - this will ensure we can only input rates below the max allowed value
    var maxValidator = new MaxRateFactorValueVisitor_ACC(errorCollector)
    model.accept(maxValidator)
  }

  private function checkErrors(errorCollector : ErrorCollector, result : PCValidationResult, model : RateTableModel) {
    if (errorCollector.getErrorCount() > 0) {
      result.addError(model.RateTable, ValidationLevel.TC_DEFAULT, errorCollector.getErrorSummary())
    }
    if (result.hasErrors()) {
      throw new EntityValidationException(result, ValidationLevel.TC_DEFAULT)
    }
  }
}