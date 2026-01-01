package nz.co.acc.common.integration.bulkupload.fieldparser

uses edge.util.either.Either
uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError

/**
 * Created by OurednM on 14/06/2018.
 */
class NamePrefixParser implements IFieldParser<NamePrefix> {

  override function parse(text: String): Either<FieldValidationError, NamePrefix> {
    var namePrefix = NamePrefix.get(text)
    if (namePrefix == null) {
      return Either.left(new FieldValidationError("Invalid title: ${text}"))
    } else {
      return Either.right(namePrefix)
    }
  }
}