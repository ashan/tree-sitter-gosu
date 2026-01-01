package nz.co.acc.rating.validation

uses gw.api.locale.DisplayKey
uses gw.rating.rtm.domain.ErrorCollector
uses gw.rating.rtm.domain.table.RateTableModel
uses gw.rating.rtm.domain.table.RateTableRow
uses gw.validation.PCValidationResult

/**
 * Validate that the CU codes have data in them i.e. not null or blank.
 */
class CUCodeValidator_ACC extends ValidationRule_ACC {

  construct(collector: ErrorCollector, result : PCValidationResult, model : RateTableModel) {
    super(collector)
    _result = result
    _model = model
  }

  override function visit(ratingRow: RateTableRow) {
    var row = ratingRow.Row
    var cuCode = row.getFieldValue(CLASSIFICATION_UNIT_CODE_KEY) as String
    var startDate = row.getFieldValue(START_DATE_KEY) as Date
    var endDate = row.getFieldValue(END_DATE_KEY) as Date
    if (cuCode == null or cuCode.isEmpty()) {
      _result.addError(_model.RateTable, ValidationLevel.TC_DEFAULT,
          DisplayKey.get("Web.Rating_ACC.RateTables.ClassificationUnitMissing", startDate.ShortFormat, endDate.ShortFormat))
    }
  }
}