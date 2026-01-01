package nz.co.acc.plm.integration.bulkupload.csvprocessor.helper

uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError
uses nz.co.acc.common.integration.bulkupload.fieldparser.EmailParser
uses nz.co.acc.common.integration.bulkupload.fieldparser.IFieldParser
uses nz.co.acc.common.integration.bulkupload.fieldparser.NonAEPACCNumberParser
uses nz.co.acc.plm.integration.bulkupload.csvtypes.RemoveContactDetailsDTO
uses nz.co.acc.plm.integration.bulkupload.fieldparser.AccountContactRoleParser
uses nz.co.acc.plm.integration.bulkupload.fieldparser.GWPhoneParser

/**
 * Created by andersc3 on 27/01/2020.
 */
class RemoveContactDetailsParserUtil {

  private final var accNumberParser = new NonAEPACCNumberParser()
  private final var contactRoleParser = new AccountContactRoleParser()
  private final var emailParser = new EmailParser()
  private final var phoneNumberParser = new GWPhoneParser()

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
      fieldValidationErrors : List<FieldValidationError>,
      fieldParser : IFieldParser<FieldType>,
      csvInput : Optional<String>,
      fieldSetter(fieldValue : FieldType) : void) {

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
   * @param accNumber
   * @param contactRole
   * @param emailAddress
   * @param phoneNumber
   */
  function parseAndSetRemoveContactDetailsFields(
      removeContactDetails: RemoveContactDetailsDTO,
      fieldValidationErrors: List<FieldValidationError>,
      accNumber: Optional<String>,
      contactRole : Optional<String>,
      emailAddress: Optional<String>,
      phoneNumber: Optional<String>) {


    parseField(fieldValidationErrors, accNumberParser, accNumber,
        \parsedResult -> {
          removeContactDetails.ACCNumber = parsedResult
        })

    parseField(fieldValidationErrors, contactRoleParser, contactRole,
        \parsedResult -> {
          removeContactDetails.contactRole = parsedResult
        })

    parseField(fieldValidationErrors, emailParser, emailAddress,
        \parsedResult -> {
          removeContactDetails.emailAddress = parsedResult
        })

    parseField(fieldValidationErrors, phoneNumberParser, phoneNumber,
        \parsedResult -> {
          removeContactDetails.phoneNumber = parsedResult.toString().replaceAll("-", "")
        })
  }

  /**
   * Verifies debit transaction fields present.
   *
   * @param accNumber    : Optional<String>
   * @param contactRole    : Optional<String>
   * @param emailAddress : Optional<String>
   * @param phoneNumber    : Optional<String>
   * @return List<FieldValidationError>
   */
  public function verifyPresenceOfMandatoryFields(
      accNumber : Optional<String>,
      contactRole : Optional<String>,
      emailAddress : Optional<String>,
      phoneNumber : Optional<String>
  ) : List<FieldValidationError> {

    var errors : LinkedList<FieldValidationError> = {}

    if (!accNumber.isPresent()) {
      errors.add(new FieldValidationError("ACC Number is required"))
    }

    if (!emailAddress.isPresent() and !phoneNumber.isPresent()) {
      errors.add(new FieldValidationError("${accNumber}:An emailAddress or a phone number is required"))
    }

    return errors
  }
}