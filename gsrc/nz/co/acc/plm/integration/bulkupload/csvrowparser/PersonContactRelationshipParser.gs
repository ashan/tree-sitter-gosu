package nz.co.acc.plm.integration.bulkupload.csvrowparser

uses edge.util.either.Either
uses gw.pl.util.csv.CSVParser
uses nz.co.acc.accountcontact.relationship.PersonContactRelationship
uses nz.co.acc.common.integration.bulkupload.csvrowparser.IRowParser
uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError
uses nz.co.acc.common.integration.bulkupload.fieldparser.ACCNumberParser
uses nz.co.acc.plm.integration.bulkupload.csvrowparser.helper.ContactParserUtil
uses nz.co.acc.plm.integration.bulkupload.fieldparser.AccountContactRoleParser
uses nz.co.acc.common.integration.bulkupload.fieldparser.DateParser
uses nz.co.acc.plm.integration.bulkupload.fieldparser.EmployeeRelationParser
uses nz.co.acc.plm.integration.bulkupload.fieldparser.ThirdPartyRelationParser
uses typekey.AccountContactRole

/**
 * Created by OurednM on 25/06/2018.
 */
class PersonContactRelationshipParser implements IRowParser<PersonContactRelationship> {

  private final var accNumberParser = new ACCNumberParser()
  private final var accountRoleParser = new AccountContactRoleParser()
  private final var dateParser = new DateParser()
  private final var thirdPartyRelationParser = new ThirdPartyRelationParser()
  private final var employeeRelationParser = new EmployeeRelationParser()
  private var _deleteRelationships: Boolean

  private construct() {
  }

  private construct(deleteRelationships: Boolean) {
    this._deleteRelationships = deleteRelationships
  }

  static function relationshipAddingParser(): PersonContactRelationshipParser {
    return new PersonContactRelationshipParser(false)
  }

  static function relationshipDeletingParser(): PersonContactRelationshipParser {
    return new PersonContactRelationshipParser(true)
  }

  override function parseRow(csvParser: CSVParser): Either<List<FieldValidationError>, PersonContactRelationship> {
    try {
      var contactAccNumber = csvParser.nextString().trim().toOptional()
      var contactFirstName = csvParser.nextString().trim().toOptional()
      var contactMiddleName = csvParser.nextString().trim().toOptional()
      var contactLastName = csvParser.nextString().trim().toOptional()
      var contactDOB = csvParser.nextString().trim().toOptional()
      var accountAccNumber = csvParser.nextString().trim().toOptional()
      var accountRole = csvParser.nextString().trim().toOptional()
      var thirdPartyRelation = csvParser.nextString().trim().toOptional()
      var employeeRelation = csvParser.nextString().trim().toOptional()

      var validationErrors = verifyPresenceOfMandatoryFields(
          contactFirstName, contactLastName, contactAccNumber, accountAccNumber, accountRole)

      var relationship = new PersonContactRelationship()
      var util = new ContactParserUtil()

      contactFirstName.each(\value -> {
        relationship.ContactFirstName = value
      })

      contactMiddleName.each(\value -> {
        relationship.ContactMiddleName = value
      })

      contactLastName.each(\value -> {
        relationship.ContactLastName = value
      })

      util.parseField(validationErrors, dateParser, contactDOB,
          \parsedResult -> {
            relationship.ContactDateOfBirth = parsedResult
          })

      util.parseField(validationErrors, accNumberParser, contactAccNumber,
          \parsedResult -> {
            relationship.ContactACCNumber = parsedResult
          })

      util.parseField(validationErrors, accNumberParser, accountAccNumber,
          \parsedResult -> {
            relationship.AccountACCNumber = parsedResult
          })

      if (!accountRole.Present && this._deleteRelationships) {
        // let AccountRole be null to delete all relationships
      } else {
        util.parseField(validationErrors, accountRoleParser, accountRole,
            \parsedResult -> {
              relationship.AccountRole = parsedResult
            })

        util.parseField(validationErrors, thirdPartyRelationParser, thirdPartyRelation,
            \parsedResult -> {
              relationship.ThirdPartyRelation = parsedResult
            })

        util.parseField(validationErrors, employeeRelationParser, employeeRelation,
            \parsedResult -> {
              relationship.EmployeeRelation = parsedResult
            })

        validateThirdPartyRelation(validationErrors, relationship.AccountRole, relationship.ThirdPartyRelation)

        validateEmployeeRelation(validationErrors, relationship.AccountRole, relationship.EmployeeRelation)
      }

      if (validationErrors.HasElements) {
        return Either.left(validationErrors)
      } else {
        return Either.right(relationship)
      }

    } catch (e: NoSuchElementException) {
      return Either.left({new FieldValidationError("Invalid row format. Missing column(s).")})
    } catch (e: Exception) {
      return Either.left({new FieldValidationError(e.toString())})
    }
  }

  private function verifyPresenceOfMandatoryFields(
      contactFirstName: Optional<String>,
      contactLastName: Optional<String>,
      contactAccNumber: Optional<String>,
      accountAccNumber: Optional<String>,
      accountRole: Optional<String>): List<FieldValidationError> {

    var errors: LinkedList<FieldValidationError> = {}

    if (!contactAccNumber.isPresent() && !(contactFirstName.isPresent() && contactLastName.isPresent())) {
      errors.add(new FieldValidationError("ContactACCNumber or Contact First/Last name is required."))
    }
    if (!accountAccNumber.isPresent()) {
      errors.add(new FieldValidationError("AccountACCNumber is required."))
    }
    if (!accountRole.isPresent() && !this._deleteRelationships) {
      errors.add(new FieldValidationError("AccountRole is required."))
    }

    return errors
  }

  private function validateThirdPartyRelation(
      validationErrors: List<FieldValidationError>,
      accountRole: AccountContactRole,
      thirdPartyRelation: Auth3rdPartyRelations_ACC) {

    if (accountRole == AccountContactRole.TC_AUTHORISED3RDPARTY_ACC
        && thirdPartyRelation == null) {
      var error = new FieldValidationError("Valid ThirdPartyRelation field must be provided for account role ${accountRole}")
      validationErrors.add(error)

    } else if (thirdPartyRelation != null && accountRole != AccountContactRole.TC_AUTHORISED3RDPARTY_ACC) {
      var error = new FieldValidationError("ThirdPartyRelation field must only be provided with account role ${AccountContactRole.TC_AUTHORISED3RDPARTY_ACC}")
      validationErrors.add(error)
    }
  }

  private function validateEmployeeRelation(
      validationErrors: List<FieldValidationError>,
      accountRole: AccountContactRole,
      employeeRelation: AuthCompEmpRelation_ACC) {

    if (accountRole == AccountContactRole.TC_AUTHORISEDCOMPANYEMPLOYEE_ACC
        && employeeRelation == null) {
      var error = new FieldValidationError("Valid EmployeeRelation field must be provided for account role ${accountRole}")
      validationErrors.add(error)

    } else if (employeeRelation != null && accountRole != AccountContactRole.TC_AUTHORISEDCOMPANYEMPLOYEE_ACC) {
      var error = new FieldValidationError("EmployeeRelation field must only be provided with account role ${AccountContactRole.TC_AUTHORISEDCOMPANYEMPLOYEE_ACC}")
      validationErrors.add(error)
    }
  }

}