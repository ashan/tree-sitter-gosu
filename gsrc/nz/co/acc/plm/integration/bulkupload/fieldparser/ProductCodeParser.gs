package nz.co.acc.plm.integration.bulkupload.fieldparser

uses edge.util.either.Either
uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError
uses nz.co.acc.common.integration.bulkupload.fieldparser.IFieldParser

/**
 * Created by Mike Ourednik on 23/01/2019.
 */
class ProductCodeParser implements IFieldParser<String> {

  override function parse(text: String): Either<FieldValidationError, String> {
    if (!text.equalsIgnoreCase('S') && !text.equalsIgnoreCase('E') && !text.equalsIgnoreCase('D')) {
      return Either.left(new FieldValidationError("Product code suffix '${text}' is invalid"))
    } else {
      return Either.right(text)
    }
  }
}