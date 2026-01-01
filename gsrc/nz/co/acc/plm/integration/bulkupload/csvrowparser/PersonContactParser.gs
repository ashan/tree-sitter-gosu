package nz.co.acc.plm.integration.bulkupload.csvrowparser

uses edge.util.either.Either
uses gw.pl.util.csv.CSVParser
uses nz.co.acc.common.integration.bulkupload.csvrowparser.IRowParser
uses nz.co.acc.plm.integration.bulkupload.csvrowparser.helper.ContactParserUtil
uses nz.co.acc.plm.integration.bulkupload.csvtypes.contact.PersonContact
uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError
uses nz.co.acc.common.integration.bulkupload.fieldparser.DateParser
uses nz.co.acc.common.integration.bulkupload.fieldparser.GenderTypeParser
uses nz.co.acc.common.integration.bulkupload.fieldparser.NamePrefixParser

/**
 * Parses a CSV row and returns a data object
 * <p>
 * Created by OurednM on 14/06/2018.
 */
class PersonContactParser implements IRowParser<PersonContact> {

  private final var dateParser = new DateParser()
  private final var genderTypeParser = new GenderTypeParser()
  private final var namePrefixParser = new NamePrefixParser()

  override function parseRow(csvParser: CSVParser): Either<List<FieldValidationError>, PersonContact> {

    try {
      // unique fields for Person contact
      var title = csvParser.nextString().trim().toOptional()
      var firstName = csvParser.nextString().trim().toOptional()
      var middleName = csvParser.nextString().trim().toOptional()
      var lastName = csvParser.nextString().trim().toOptional()
      var gender = csvParser.nextString().trim().toOptional()
      var dateOfBirth = csvParser.nextString().trim().toOptional()

      // common contact fields
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
          firstName, lastName, country, address1, city, postcode, addressType, addressLocationType)

      var personContact = new PersonContact()
      var util = new ContactParserUtil()

      // parse common fields
      util.parseAndSetContactCommonFields(personContact, parseErrors,
          primaryPhoneType, homePhone, workPhone, mobilePhone, faxPhone, primaryEmail,
          secondaryEmail, irNumber, accNumber, country, attention, address1, address2,
          address3, city, postcode, validUntil, addressType, addressLocationType)

      // parse unique fields

      util.parseField(parseErrors, namePrefixParser, title,
          \parsedResult -> {
            personContact.Title = parsedResult
          })

      firstName.each(\value -> {
        personContact.FirstName = value
      })

      middleName.each(\value -> {
        personContact.MiddleName = value
      })

      lastName.each(\value -> {
        personContact.LastName = value
      })

      util.parseField(parseErrors, genderTypeParser, gender,
          \parsedResult -> {
            personContact.Gender = parsedResult
          })

      util.parseField(parseErrors, dateParser, dateOfBirth,
          \parsedResult -> {
            personContact.DateOfBirth = parsedResult
          })


      if (parseErrors.HasElements) {
        return Either.left(parseErrors)
      } else {
        return Either.right(personContact)
      }

    } catch (e: NoSuchElementException) {
      return Either.left({new FieldValidationError("Invalid row format. Missing column(s).")})
    } catch (e: Exception) {
      return Either.left({new FieldValidationError("Error occurred when parsing this row: ${e.Message}")})
    }
  }

  private function verifyPresenceOfMandatoryFields(
      firstName: Optional<String>,
      lastName: Optional<String>,
      country: Optional<String>,
      address1: Optional<String>,
      city: Optional<String>,
      postCode: Optional<String>,
      accAddressType: Optional<String>,
      addressLocationType: Optional<String>): List<FieldValidationError> {

    var errors: LinkedList<FieldValidationError> = {}

    if (!firstName.isPresent()) {
      errors.add(new FieldValidationError("FirstName is required"))
    }
    if (!lastName.isPresent()) {
      errors.add(new FieldValidationError("LastName is required"))
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