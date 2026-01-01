package nz.co.acc.plm.integration.bulkupload.csvrowparser

uses edge.util.either.Either
uses gw.pl.util.csv.CSVParser
uses nz.co.acc.common.integration.bulkupload.csvrowparser.IRowParser
uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError
uses nz.co.acc.plm.integration.bulkupload.csvprocessor.helper.RemoveContactDetailsParserUtil
uses nz.co.acc.plm.integration.bulkupload.csvtypes.RemoveContactDetailsDTO

/**
 * Created by andersc3 on 27/01/2020.
 */
class RemoveContactDetailsParser implements IRowParser<RemoveContactDetailsDTO> {

  override function parseRow(csvParser : CSVParser) : Either<List<FieldValidationError>, RemoveContactDetailsDTO> {
    try {
      var accNumber = csvParser.nextString().trim().toOptional()
      var emailAddress = csvParser.nextString().trim().toOptional()
      var phoneNumber = csvParser.nextString().trim().toOptional()
      var contactRole = csvParser.nextString().trim().toOptional()

      var util = new RemoveContactDetailsParserUtil()
      var parseErrors = util.verifyPresenceOfMandatoryFields(
          accNumber, emailAddress, phoneNumber, contactRole)

      var RemoveContactDetailsDTO = new RemoveContactDetailsDTO()

      // parse common fields
      util.parseAndSetRemoveContactDetailsFields(RemoveContactDetailsDTO,
          parseErrors,
          accNumber,
          emailAddress,
          phoneNumber,
          contactRole)

      if (parseErrors.HasElements) {
        return Either.left(parseErrors)
      } else {
        return Either.right(RemoveContactDetailsDTO)
      }

    } catch (e : NoSuchElementException) {
      return Either.left({new FieldValidationError("Invalid row format. Missing column(s).")})
    } catch (e : Exception) {
      return Either.left({new FieldValidationError(e.toString())})
    }
  }
}