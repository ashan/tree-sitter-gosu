package nz.co.acc.plm.integration.bulkupload.csvrowparser

uses edge.util.either.Either
uses gw.pl.util.csv.CSVParser
uses nz.co.acc.common.integration.bulkupload.csvrowparser.IRowParser
uses nz.co.acc.plm.integration.bulkupload.csvtypes.MigratedHold
uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError

/**
 * Parses a CSV row and returns a data object
 *
 * Created by ChrisA on 01/10/2018 based on MikeO's code for CompanyContactParser
 * US12192 process Migrated Policy Holds
 */
class MigratedHoldParser implements IRowParser<MigratedHold> {

  override function parseRow(csvParser: CSVParser): Either<List<FieldValidationError>, MigratedHold> {

    try {
      var accNumber = csvParser.nextString().trim().toOptional()
      var suffix = csvParser.nextString().trim().toOptional()
      var levyYear = csvParser.nextString().trim().toOptional()

      var parseErrors = verifyPresenceOfMandatoryFields(
          accNumber, suffix, levyYear)

      var migratedHold = new MigratedHold()
      var util = new MigratedHoldParserUtil()

      // parse common fields
      util.parseAndSetMigratedHoldFields(migratedHold, parseErrors, accNumber, suffix, levyYear)

      if (parseErrors.HasElements) {
        return Either.left(parseErrors)
      } else {
        return Either.right(migratedHold)
      }

    } catch (e: NoSuchElementException) {
      return Either.left({new FieldValidationError("Invalid row format. Missing column(s).")})
    } catch (e: Exception) {
      return Either.left({new FieldValidationError(e.toString())})
    }
  }

  private function verifyPresenceOfMandatoryFields(
      accNumber: Optional<String>,
      suffix: Optional<String>,
      levyYear: Optional<String>) : List<FieldValidationError>{

    var errors: LinkedList<FieldValidationError> = {}

    if (!accNumber.isPresent()) {
      errors.add(new FieldValidationError("ACC Number is required"))
    }
    if (!suffix.isPresent()) {
      errors.add(new FieldValidationError("Suffix is required"))
    }
    if (!levyYear.isPresent()) {
      errors.add(new FieldValidationError("Levy Year is required"))
    }

    return errors
  }
}