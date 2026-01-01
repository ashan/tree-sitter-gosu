package nz.co.acc.plm.integration.bulkupload.csvrowparser.helper

uses nz.co.acc.account.AccountUtil
uses nz.co.acc.plm.integration.bulkupload.csvtypes.contact.IContactCommonFields
uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError
uses nz.co.acc.common.integration.bulkupload.fieldparser.ACCNumberParser
uses nz.co.acc.plm.integration.bulkupload.fieldparser.AddressLocationTypeParser
uses nz.co.acc.plm.integration.bulkupload.fieldparser.AddressTypeParser
uses nz.co.acc.common.integration.bulkupload.fieldparser.CountryParser
uses nz.co.acc.common.integration.bulkupload.fieldparser.DateParser
uses nz.co.acc.common.integration.bulkupload.fieldparser.EmailParser
uses nz.co.acc.plm.integration.bulkupload.fieldparser.GWPhoneParser
uses nz.co.acc.common.integration.bulkupload.fieldparser.IFieldParser
uses nz.co.acc.plm.integration.bulkupload.fieldparser.IRDNumberParser
uses nz.co.acc.plm.integration.bulkupload.fieldparser.PrimaryPhoneTypeParser

/**
 * Created by OurednM on 18/06/2018.
 */
class ContactParserUtil {

  private final var accNumberParser = new ACCNumberParser()
  private final var addressLocationTypeParser = new AddressLocationTypeParser()
  private final var addressTypeParser = new AddressTypeParser()
  private final var countryParser = new CountryParser()
  private final var dateParser = new DateParser()
  private final var emailParser = new EmailParser()
  private final var gwPhoneParser = new GWPhoneParser()
  private final var irdNumberParser = new IRDNumberParser()
  private final var primaryPhoneTypeParser = new PrimaryPhoneTypeParser()

  /**
   * Generic function to parse a single CSV field
   *
   * @param fieldValidationErrors
   * @param fieldParser
   * @param csvInput
   * @param fieldSetter
   * @param <FieldType>
   */
  function parseField<FieldType>(
      fieldValidationErrors: List<FieldValidationError>,
      fieldParser: IFieldParser<FieldType>,
      csvInput: Optional<String>,
      fieldSetter(fieldValue: FieldType): void) {

    if (csvInput.isPresent()) {
      var parseResult = fieldParser.parse(csvInput.get())
      if (parseResult.isLeft) {
        fieldValidationErrors.add(parseResult.left)
      } else {
        fieldSetter(parseResult.right)
      }
    }
  }

  /**
   * Parses fields that are common between Person and Company contacts.
   *
   * @param contact               The destination data object to write fields to
   * @param fieldValidationErrors The destination list of parse errors to append to
   * @param primaryPhoneType
   * @param homePhone
   * @param workPhone
   * @param mobilePhone
   * @param faxPhone
   * @param primaryEmail
   * @param secondaryEmail
   * @param irNumber
   * @param accNumber
   * @param country
   * @param attention
   * @param address1
   * @param address2
   * @param address3
   * @param city
   * @param postalCode
   * @param validUntil
   * @param addressType
   * @param addressLocationType
   */
  function parseAndSetContactCommonFields(
      contact: IContactCommonFields,
      fieldValidationErrors: List<FieldValidationError>,
      primaryPhoneType: Optional<String>,
      homePhone: Optional<String>,
      workPhone: Optional<String>,
      mobilePhone: Optional<String>,
      faxPhone: Optional<String>,
      primaryEmail: Optional<String>,
      secondaryEmail: Optional<String>,
      irNumber: Optional<String>,
      accNumber: Optional<String>,
      country: Optional<String>,
      attention: Optional<String>,
      address1: Optional<String>,
      address2: Optional<String>,
      address3: Optional<String>,
      city: Optional<String>,
      postalCode: Optional<String>,
      validUntil: Optional<String>,
      addressType: Optional<String>,
      addressLocationType: Optional<String>) {

    parseField(fieldValidationErrors, primaryPhoneTypeParser, primaryPhoneType,
        \parsedResult -> {
          contact.PrimaryPhoneType = parsedResult
        })

    parseField(fieldValidationErrors, gwPhoneParser, homePhone,
        \parsedResult -> {
          contact.HomePhone = parsedResult
        })

    parseField(fieldValidationErrors, gwPhoneParser, workPhone,
        \parsedResult -> {
          contact.WorkPhone = parsedResult
        })

    parseField(fieldValidationErrors, gwPhoneParser, mobilePhone,
        \parsedResult -> {
          contact.CellPhone = parsedResult
        })

    parseField(fieldValidationErrors, gwPhoneParser, faxPhone,
        \parsedResult -> {
          contact.FaxPhone = parsedResult
        })

    parseField(fieldValidationErrors, emailParser, primaryEmail,
        \parsedResult -> {
          contact.PrimaryEmail = parsedResult
        })

    parseField(fieldValidationErrors, emailParser, secondaryEmail,
        \parsedResult -> {
          contact.SecondaryEmail = parsedResult
        })

    parseField(fieldValidationErrors, irdNumberParser, irNumber,
        \parsedResult -> {
          contact.IRNumber = parsedResult
        })

    parseField(fieldValidationErrors, accNumberParser, accNumber,
        \parsedResult -> {
          contact.ACCNumber = parsedResult
        })

    parseField(fieldValidationErrors, countryParser, country,
        \parsedResult -> {
          contact.Country = parsedResult
        })

    attention.each(\value -> {
      contact.Attention = value
    })

    address1.each(\value -> {
      contact.Address1 = value
    })

    address2.each(\value -> {
      contact.Address2 = value
    })

    address3.each(\value -> {
      contact.Address3 = value
    })

    city.each(\value -> {
      contact.City = value
    })

    postalCode.each(\value -> {
      contact.PostalCode = value
    })

    parseField(fieldValidationErrors, dateParser, validUntil,
        \parsedResult -> {
          contact.ValidUntil = parsedResult
        })

    parseField(fieldValidationErrors, addressTypeParser, addressType,
        \parsedResult -> {
          contact.AddressType = parsedResult
        })

    parseField(fieldValidationErrors, addressLocationTypeParser, addressLocationType,
        \parsedResult -> {
          contact.AddressLocationType = parsedResult
        })

    updateACCID(contact)
  }


  /**
   * Generates a new ACC number based on the users provided IRD number if applicable.
   *
   * @param contact
   * @return
   */
  public static function updateACCID(contact: IContactCommonFields) {
    if (!contact.ACCNumber.NotBlank && contact.IRNumber.NotBlank) {
      var convertedACCNumber = AccountUtil.IRDNumberToACCNumber(contact.IRNumber)
      contact.ACCNumber = convertedACCNumber
    }
  }
}