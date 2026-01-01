package nz.co.acc.plm.integration.bulkupload.csvrowparser

uses edge.util.either.Either
uses gw.pl.util.csv.CSVParser
uses nz.co.acc.accountcontact.relationship.CompanyContactRelationship
uses nz.co.acc.common.integration.bulkupload.csvrowparser.IRowParser
uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError
uses nz.co.acc.common.integration.bulkupload.fieldparser.ACCNumberParser
uses nz.co.acc.plm.integration.bulkupload.csvrowparser.helper.ContactParserUtil
uses nz.co.acc.plm.integration.bulkupload.fieldparser.AccountContactRoleParser

/**
 * Created by OurednM on 25/06/2018.
 */
class CompanyContactRelationshipParser implements IRowParser<CompanyContactRelationship> {

  private final var accNumberParser = new ACCNumberParser()
  private final var accountRoleParser = new AccountContactRoleParser()
  private var _deleteRelationships: Boolean

  private construct() {
  }

  private construct(deleteRelationships: Boolean) {
    this._deleteRelationships = deleteRelationships
  }

  static function relationshipAddingParser(): CompanyContactRelationshipParser {
    return new CompanyContactRelationshipParser(false)
  }

  static function relationshipDeletingParser(): CompanyContactRelationshipParser {
    return new CompanyContactRelationshipParser(true)
  }

  override function parseRow(csvParser: CSVParser): Either<List<FieldValidationError>, CompanyContactRelationship> {
    try {
      var contactAccNumber = csvParser.nextString().trim().toOptional()
      var contactName = csvParser.nextString().trim().toOptional()
      var accountAccNumber = csvParser.nextString().trim().toOptional()
      var accountRole = csvParser.nextString().trim().toOptional()

      var validationErrors = verifyPresenceOfMandatoryFields(
          contactName, contactAccNumber, accountAccNumber, accountRole)

      var relationship = new CompanyContactRelationship()
      var util = new ContactParserUtil()

      contactName.each(\value -> {
        relationship.ContactName = value
      })

      util.parseField(validationErrors, accNumberParser, contactAccNumber,
          \parsedResult -> {
            relationship.ContactACCNumber = parsedResult
          })

      if (!accountRole.Present && this._deleteRelationships) {
        // let AccountRole be null to delete all relationships
      } else {
        util.parseField(validationErrors, accountRoleParser, accountRole,
            \parsedResult -> {
              relationship.AccountRole = parsedResult
            })
      }

      util.parseField(validationErrors, accNumberParser, accountAccNumber,
          \parsedResult -> {
            relationship.AccountACCNumber = parsedResult
          })

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
      contactName: Optional<String>,
      contactAccNumber: Optional<String>,
      accountAccNumber: Optional<String>,
      accountRole: Optional<String>): List<FieldValidationError> {

    var errors: LinkedList<FieldValidationError> = {}

    if (!contactName.isPresent() && !contactAccNumber.isPresent()) {
      errors.add(new FieldValidationError("ContactName or ContactACCNumber is required."))
    }
    if (!accountAccNumber.isPresent()) {
      errors.add(new FieldValidationError("AccountACCNumber is required."))
    }
    if (!accountRole.isPresent() && !this._deleteRelationships) {
      errors.add(new FieldValidationError("AccountRole is required."))
    }

    return errors
  }

}