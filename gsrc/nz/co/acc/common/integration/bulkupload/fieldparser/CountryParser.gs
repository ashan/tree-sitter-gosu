package nz.co.acc.common.integration.bulkupload.fieldparser

uses edge.util.either.Either
uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError

/**
 * Created by OurednM on 14/06/2018.
 */
class CountryParser implements IFieldParser<Country> {

  override function parse(text: String): Either<FieldValidationError, Country> {
    var country = Country.get(text)
    if (country == null) {
      return Either.left(new FieldValidationError("Invalid country code: ${text}"))
    } else {
      return Either.right(country)
    }
  }
}