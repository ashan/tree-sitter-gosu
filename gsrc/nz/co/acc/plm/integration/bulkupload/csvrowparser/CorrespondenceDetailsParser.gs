package nz.co.acc.plm.integration.bulkupload.csvrowparser

uses edge.util.either.Either
uses gw.pl.util.csv.CSVParser
uses nz.co.acc.common.integration.bulkupload.csvrowparser.IRowParser
uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError
uses nz.co.acc.common.integration.bulkupload.fieldparser.BooleanParser
uses nz.co.acc.plm.integration.bulkupload.csvtypes.CorrespondenceDetailsRow
uses nz.co.acc.plm.integration.bulkupload.fieldparser.ContactTypeParser
uses nz.co.acc.plm.integration.bulkupload.fieldparser.CorrespondencePreferenceParser

class CorrespondenceDetailsParser implements IRowParser<CorrespondenceDetailsRow> {

  var _correspondencePreferenceParser = new CorrespondencePreferenceParser()
  var _contactTypeParser = new ContactTypeParser()
  var _booleanParser = new BooleanParser()

  override function parseRow(csvParser : CSVParser) : Either<List<FieldValidationError>, CorrespondenceDetailsRow> {
    var accId = csvParser.nextString().trim().toOptional()
    var contactType = csvParser.nextString().trim().toOptional()
    var correspondencePreference = csvParser.nextString().trim().toOptional()
    var primaryEmail = csvParser.nextString().trim().toOptional()
    var emailVerified = csvParser.nextString().trim().toOptional()
    var secondaryEmail = csvParser.nextString().trim().toOptional()
    var dto = new CorrespondenceDetailsRow()

    var errors : ArrayList<FieldValidationError> = {}

    if (!accId.isPresent()) {
      errors.add(new FieldValidationError("ACC Number is required"))
    }

    // accNumber field
    accId.each(\value -> {
      dto.accId = value
    })

    // correspondencePreference field
    parseField(
        errors,
        _correspondencePreferenceParser,
        correspondencePreference,
        \parsedResult -> {
          dto.correspondencePreference = parsedResult
        })

    // contactType field
    parseField(
        errors,
        _contactTypeParser,
        contactType,
        \parsedResult -> {
          dto.contactType = parsedResult
        })

    // primaryEmail field
    primaryEmail.each(\value -> {
      dto.primaryEmail = value
    })

    // emailVerified field
    parseField(
        errors,
        _booleanParser,
        emailVerified,
        \parsedResult -> {
          dto.emailVerified = parsedResult
        })

    // secondaryEmail field
    secondaryEmail.each(\value -> {
      dto.secondaryEmail = value
    })

    // validate
    if (dto.correspondencePreference == CorrespondencePreference_ACC.TC_EMAIL
        and dto.emailVerified == false) {
      errors.add(new FieldValidationError("EmailVerified cannot be false for email correspondence preference"))
    }

    if (errors.HasElements) {
      return Either.left(errors)
    } else {
      return Either.right(dto)
    }
  }

}