package nz.co.acc.plm.integration.bulkupload.fieldparser

uses edge.util.either.Either
uses gw.api.util.PhoneUtil
uses gw.api.util.phone.GWPhoneNumber
uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError
uses nz.co.acc.common.integration.bulkupload.fieldparser.IFieldParser

/**
 * Created by OurednM on 14/06/2018.
 */
class GWPhoneParser implements IFieldParser<GWPhoneNumber> {

  override function parse(text: String): Either<FieldValidationError, GWPhoneNumber> {
    var gwPhoneNumber = PhoneUtil.parse(text, PhoneCountryCode.TC_NZ)
    if (gwPhoneNumber.isValid()) {
      return Either.right(gwPhoneNumber)
    } else {
      return Either.left(new FieldValidationError("Invalid phone number: ${text}"))
    }
  }
}