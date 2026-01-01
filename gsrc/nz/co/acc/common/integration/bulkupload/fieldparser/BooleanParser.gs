package nz.co.acc.common.integration.bulkupload.fieldparser

uses edge.util.either.Either
uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError

/**
 * Created by Mike Ourednik on 06/04/2020.
 */
class BooleanParser implements IFieldParser<Boolean> {

  final static var FALSE_VALUES : Set<String> = {"", "false", "no", "n", "0"}
  final static var TRUE_VALUES : Set<String> = {"true", "yes", "y", "1"}

  override function parse(text : String) : Either<FieldValidationError, Boolean> {
    if (FALSE_VALUES.contains(text.toLowerCase())) {
      return Either.right(Boolean.FALSE)

    } else if (TRUE_VALUES.contains(text.toLowerCase())) {
      return Either.right(Boolean.TRUE)

    } else {
      return Either.left(new FieldValidationError("[${text}] cannot be parsed as a boolean value."))
    }

  }
}