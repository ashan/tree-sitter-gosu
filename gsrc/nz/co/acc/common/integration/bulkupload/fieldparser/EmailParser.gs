package nz.co.acc.common.integration.bulkupload.fieldparser

uses edge.util.either.Either
uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError

uses java.util.regex.Pattern

/**
 * Created by OurednM on 14/06/2018.
 */
class EmailParser implements IFieldParser<String> {

  final static var EMAIL_PATTERN = Pattern.compile(".+@.+")

  override function parse(text: String): Either<FieldValidationError, String> {
    if (EMAIL_PATTERN.matcher(text).matches()) {
      return Either.right(text)
    } else {
      return Either.left(new FieldValidationError("Invalid email address: ${text}"))
    }
  }
}