package nz.co.acc.rating.validation

uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.rating.rtm.domain.ErrorCollector
uses gw.rating.rtm.domain.table.RateTableModel
uses gw.rating.rtm.domain.table.RateTableRow
uses gw.util.Pair
uses gw.validation.PCValidationResult

/**
 * Validate that only one year's rates exists.
 */
class OneYearOfRatesValidator_ACC extends ValidationRule_ACC {
  private var _years : Set<Pair<Date, Date>>

  construct(collector: ErrorCollector, result : PCValidationResult, model : RateTableModel) {
    super(collector)
    _result = result
    _model = model
    _years = new HashSet<Pair<Date, Date>>()
  }

  override function visit(ratingRow: RateTableRow) {
    var row = ratingRow.Row
    var startDate = row.getFieldValue(START_DATE_KEY) as Date
    var endDate = row.getFieldValue(END_DATE_KEY) as Date
    if(_model.RateBook.ExpirationDate.YearOfDate == endDate.YearOfDate) {
      var year = new Pair<Date, Date>(startDate, endDate)
      _years.add(year)
    } else {
      throw new DisplayableException(DisplayKey.get("Validation.Rating.RateTableDefinition.LevyYearIsIncorrect", ratingRow.toString()))
    }
  }

  public function moreThanOneYearsRates() : boolean {
    return !_years.isEmpty() and _years.size() > 1
  }

  public function validatedLevyYear() : Pair<Date, Date> {
    if (moreThanOneYearsRates()) {
      throw new UnsupportedOperationException("This operation is not supported when there is more than one year.")
    } else {
      return _years.first()
    }
  }
}