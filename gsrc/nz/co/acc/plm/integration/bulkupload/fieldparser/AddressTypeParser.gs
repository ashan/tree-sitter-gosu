package nz.co.acc.plm.integration.bulkupload.fieldparser

uses edge.util.either.Either
uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError
uses nz.co.acc.common.integration.bulkupload.fieldparser.IFieldParser

/**
 * Created by OurednM on 14/06/2018.
 */
class AddressTypeParser implements IFieldParser<AddressType> {

  private static var allowedAddressTypes: List<AddressType> = AddressType.TF_CUSTOMER.TypeKeys.freeze()

  override function parse(text: String): Either<FieldValidationError, AddressType> {
    var addressType: AddressType = null

    addressType = AddressType.get(text)
    if (addressType == null) {
      return Either.left(new FieldValidationError("Invalid address type: ${text}"))
    }

    if (!allowedAddressTypes.contains(addressType)) {
      return Either.left(new FieldValidationError("Address type must be one of: ${allowedAddressTypes.join(", ")}"))
    } else {
      return Either.right(addressType)
    }
  }
}