package nz.co.acc.plm.integration.bulkupload.fieldparser

uses edge.util.either.Either
uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError
uses nz.co.acc.common.integration.bulkupload.fieldparser.IFieldParser

/**
 * Created by OurednM on 14/06/2018.
 */
class PrimaryPhoneTypeParser implements IFieldParser<PrimaryPhoneType> {

  override function parse(text: String): Either<FieldValidationError, PrimaryPhoneType> {
    var primaryPhoneType = PrimaryPhoneType.get(text)
    if (primaryPhoneType == null) {
      return Either.left(new FieldValidationError("Invalid primary phone type: ${text}"))
    } else {
      return Either.right(primaryPhoneType)
    }
  }
}