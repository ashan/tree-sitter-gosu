package nz.co.acc.plm.integration.bulkupload.csvrowparser

uses edge.util.either.Either
uses gw.pl.util.csv.CSVParser
uses nz.co.acc.common.integration.bulkupload.csvrowparser.IRowParser
uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError
uses nz.co.acc.common.integration.bulkupload.fieldparser.BooleanParser
uses nz.co.acc.plm.integration.bulkupload.csvtypes.CorrespondenceDetailsRow
uses nz.co.acc.plm.integration.bulkupload.csvtypes.InvalidateContactDetailsRow
uses nz.co.acc.plm.integration.bulkupload.fieldparser.CorrespondencePreferenceParser

class InvalidateContactDetailsParser implements IRowParser<InvalidateContactDetailsRow> {

  override function parseRow(csvParser : CSVParser) : Either<List<FieldValidationError>, InvalidateContactDetailsRow> {
    var accId = csvParser.nextString().trim().toOptional()
    var invalidateType = csvParser.nextString().trim().toOptional()
    var dto = new InvalidateContactDetailsRow()

    var errors : ArrayList<FieldValidationError> = {}

    if (!accId.isPresent()) {
      errors.add(new FieldValidationError("ACC Number is required"))
    }

    if (!invalidateType.isPresent()) {
      errors.add(new FieldValidationError("Invalid type is required"))
    }

    accId.each(\value -> {
      dto.accId = value
    })

    invalidateType.each(\value -> {
      dto.invalidateType = InvalidContactInfoType_ACC.getTypeKey(value)
    })

    if (errors.HasElements) {
      return Either.left(errors)
    } else {
      return Either.right(dto)
    }
  }
}