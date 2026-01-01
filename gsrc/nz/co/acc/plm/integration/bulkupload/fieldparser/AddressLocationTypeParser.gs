package nz.co.acc.plm.integration.bulkupload.fieldparser

uses edge.util.either.Either
uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError
uses nz.co.acc.common.integration.bulkupload.fieldparser.IFieldParser

/**
 * Created by OurednM on 14/06/2018.
 */
class AddressLocationTypeParser implements IFieldParser<AddressLocationType_ACC> {

  override function parse(text: String): Either<FieldValidationError, AddressLocationType_ACC> {
    var addressLocationType = AddressLocationType_ACC.get(text)
    if (addressLocationType == null) {
      return Either.left(new FieldValidationError("Invalid address location type: ${text}"))
    } else {
      return Either.right(addressLocationType)
    }
  }
}