package nz.co.acc.plm.integration.bulkupload.fieldparser

uses edge.util.either.Either
uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError
uses nz.co.acc.common.integration.bulkupload.fieldparser.IFieldParser

/**
 * Created by OurednM on 14/06/2018.
 */
class CorrespondencePreferenceParser implements IFieldParser<CorrespondencePreference_ACC> {

  override function parse(text: String): Either<FieldValidationError, CorrespondencePreference_ACC> {
    var correspondencePreference = CorrespondencePreference_ACC.get(text)
    if (correspondencePreference == null) {
      return Either.left(new FieldValidationError("Invalid correspondence preference: ${text}"))
    } else {
      return Either.right(correspondencePreference)
    }
  }
}