package nz.co.acc.common.integration.bulkupload.fieldparser

uses edge.util.either.Either
uses nz.co.acc.common.integration.files.inbound.utils.InboundUtility
uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError

/**
 * Created by OurednM on 14/06/2018.
 */
class ACCNumberParser implements IFieldParser<String> {

  override function parse(text: String): Either<FieldValidationError, String> {
    if (InboundUtility.isValidACCAccountNumberFormat(text)) {
      return Either.right(text)
    } else {
      return Either.left(new FieldValidationError("ACC account number has invalid syntax: ${text}"))
    }
  }
}