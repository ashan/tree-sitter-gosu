package nz.co.acc.plm.integration.bulkupload.csvrowparser

uses edge.util.either.Either
uses gw.pl.util.csv.CSVParser
uses nz.co.acc.common.integration.bulkupload.csvrowparser.IRowParser
uses nz.co.acc.plm.integration.bulkupload.csvrowparser.helper.ContactParserUtil
uses nz.co.acc.plm.integration.bulkupload.csvtypes.contact.CompanyContact
uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError

/**
 * Parses a CSV row and returns a data object
 * <p>
 * Created by OurednM on 14/06/2018.
 */
class CompanyContactParser implements IRowParser<CompanyContact> {


  override function parseRow(csvParser: CSVParser): Either<List<FieldValidationError>, CompanyContact> {

    try {
      var name = csvParser.nextString().trim().toOptional()
      var irNumber = csvParser.nextString().trim().toOptional()
      var accNumber = csvParser.nextString().trim().toOptional()
      var primaryPhoneType = csvParser.nextString().trim().toOptional()
      var homePhone = csvParser.nextString().trim().toOptional()
      var workPhone = csvParser.nextString().trim().toOptional()
      var mobilePhone = csvParser.nextString().trim().toOptional()
      var faxPhone = csvParser.nextString().trim().toOptional()
      var primaryEmail = csvParser.nextString().trim().toOptional()
      var secondaryEmail = csvParser.nextString().trim().toOptional()
      var country = csvParser.nextString().trim().toOptional()
      var attention = csvParser.nextString().trim().toOptional()
      var address1 = csvParser.nextString().trim().toOptional()
      var address2 = csvParser.nextString().trim().toOptional()
      var address3 = csvParser.nextString().trim().toOptional()
      var city = csvParser.nextString().trim().toOptional()
      var postcode = csvParser.nextString().trim().toOptional()
      var validUntil = csvParser.nextString().trim().toOptional()
      var addressType = csvParser.nextString().trim().toOptional()
      var addressLocationType = csvParser.nextString().trim().toOptional()

      var parseErrors = verifyPresenceOfMandatoryFields(
          name, homePhone, country, address1, city, postcode, addressType, addressLocationType)

      var companyContact = new CompanyContact()
      var util = new ContactParserUtil()

      // parse common fields
      util.parseAndSetContactCommonFields(companyContact, parseErrors,
          primaryPhoneType, homePhone, workPhone, mobilePhone, faxPhone, primaryEmail,
          secondaryEmail, irNumber, accNumber, country, attention, address1, address2,
          address3, city, postcode, validUntil, addressType, addressLocationType)

      // parse unique fields
      name.each(\value -> {
        companyContact.Name = value
      })

      if (parseErrors.HasElements) {
        return Either.left(parseErrors)
      } else {
        return Either.right(companyContact)
      }

    } catch (e: NoSuchElementException) {
      return Either.left({new FieldValidationError("Invalid row format. Missing column(s).")})
    } catch (e: Exception) {
      return Either.left({new FieldValidationError(e.toString())})
    }
  }

  private function verifyPresenceOfMandatoryFields(
      name: Optional<String>,
      homePhone: Optional<String>,
      country: Optional<String>,
      address1: Optional<String>,
      city: Optional<String>,
      postCode: Optional<String>,
      accAddressType: Optional<String>,
      addressLocationType: Optional<String>): List<FieldValidationError> {

    var errors: LinkedList<FieldValidationError> = {}

    if (!name.isPresent()) {
      errors.add(new FieldValidationError("Name is required"))
    }
    if (!homePhone.isPresent()) {
      errors.add(new FieldValidationError("HomePhone is required"))
    }
    if (!country.isPresent()) {
      errors.add(new FieldValidationError("Country code is required"))
    }
    if (!address1.isPresent()) {
      errors.add(new FieldValidationError("Address1 is required"))
    }
    if (!city.isPresent()) {
      errors.add(new FieldValidationError("City is required"))
    }
    if (!postCode.isPresent()) {
      errors.add(new FieldValidationError("PostalCode is required"))
    }
    if (!accAddressType.isPresent()) {
      errors.add(new FieldValidationError("ACCAddressType is required"))
    }
    if (!addressLocationType.isPresent()) {
      errors.add(new FieldValidationError("AddressLocationType is required"))
    }

    return errors
  }
}