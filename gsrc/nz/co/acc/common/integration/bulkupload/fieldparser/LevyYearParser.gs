package nz.co.acc.common.integration.bulkupload.fieldparser

uses edge.util.either.Either
uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError

/**
 * Created by Mike Ourednik on 23/01/2019.
 */
class LevyYearParser implements IFieldParser<Integer> {

  override function parse(text: String): Either<FieldValidationError, Integer> {
    if (text.Numeric) {
      var levyYear = text.toInt()
      if (levyYear < 2001 || levyYear > 2100) {
        return Either.left(new FieldValidationError("Levy year specified: ${text} is invalid"))
      } else {

        return Either.right(levyYear)
      }
    } else {
      return Either.left(new FieldValidationError("Levy year specified: ${text} is invalid"))
    }
  }
}