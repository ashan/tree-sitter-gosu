package nz.co.acc.plm.integration.bulkupload.fieldparser

uses edge.util.either.Either
uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError
uses nz.co.acc.common.integration.bulkupload.fieldparser.IFieldParser
uses nz.co.acc.validation.IRDNumberValidator_ACC

/**
 * Created by OurednM on 14/06/2018.
 */
class IRDNumberParser implements IFieldParser<String> {

  final static var irdNumberValidator: IRDNumberValidator_ACC = new IRDNumberValidator_ACC()

  override function parse(text: String): Either<FieldValidationError, String> {
    if (irdNumberValidator.validateParsedIRDNumber_ACC(text)) {
      return Either.right(text)
    } else {
      return Either.left(new FieldValidationError("Invalid IRD number: ${text}"))
    }
  }
}