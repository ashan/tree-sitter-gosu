package nz.co.acc.common.integration.bulkupload.fieldparser

uses edge.util.either.Either
uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError

uses java.text.ParseException
uses java.text.SimpleDateFormat

/**
 * Created by OurednM on 14/06/2018.
 */
class DateParser implements IFieldParser<Date> {

  public final static var UK_DATE_FORMAT : String = "dd/MM/yyyy"
  public final static var ISO_DATE_FORMAT : String = "yyyy-MM-dd"

  private var _minDate : Date

  public construct() {
  }

  public function withMinDate(minDate : Date) : DateParser {
    _minDate = minDate
    return this
  }

  override function parse(text : String) : Either<FieldValidationError, Date> {
    var date : Date
    try {
      date = createDateFromString(text, ISO_DATE_FORMAT)
    } catch (e : ParseException) {
    }

    try {
      date = createDateFromString(text, UK_DATE_FORMAT)
    } catch (e : ParseException) {
    }

    if (date == null) {
      return Either.left(new FieldValidationError("Invalid date: ${text}"))

    } else if (_minDate == null) {
      return Either.right(date)

    } else if (date.before(_minDate)) {
      return Either.left(new FieldValidationError("Date ${date.toISODate()} cannot be before date ${_minDate.toISODate()}"))

    } else {
      return Either.right(date)
    }

  }

  private function createDateFromString(date : String, format : String) : Date {
    if (date != null) {
      var df = new SimpleDateFormat(format)
      df.setLenient(false)
      return df.parse(date)
    } else {
      return null
    }
  }

}