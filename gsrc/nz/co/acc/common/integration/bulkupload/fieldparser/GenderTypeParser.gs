package nz.co.acc.common.integration.bulkupload.fieldparser

uses edge.util.either.Either
uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError

/**
 * Created by OurednM on 14/06/2018.
 */
class GenderTypeParser implements IFieldParser<GenderType> {

  override function parse(text: String): Either<FieldValidationError, GenderType> {
    var genderType = GenderType.get(text)
    if (genderType == null) {
      return Either.left(new FieldValidationError("Invalid gender: ${text}"))
    } else {
      return Either.right(genderType)
    }
  }
}