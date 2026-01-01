package nz.co.acc.gwer.bulkupload.parser

uses edge.util.either.Either
uses gw.pl.util.csv.CSVParser
uses nz.co.acc.common.integration.bulkupload.csvrowparser.IRowParser
uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError
uses nz.co.acc.gwer.bulkupload.row.BusinessGroupRow
uses nz.co.acc.gwer.bulkupload.row.ERParameterValueRow

uses java.text.SimpleDateFormat

/**
 * Created by HamblyAl on 18/03/2019.
 */
class ERParameterValueParser implements IRowParser<ERParameterValueRow> {
  var levyYear : OptionalInt
  var paramCode : Optional<String>
  var paramValue : Optional<String>

  override function parseRow(csvParser : CSVParser) : Either<List<FieldValidationError>, ERParameterValueRow> {
    levyYear = OptionalInt.of(csvParser.nextInt())
    paramCode = csvParser.nextString().trim().toOptional()
    paramValue = csvParser.nextString().trim().toOptional()
    var parseErrors = validateRowData()

    var erParameterValueRow = new ERParameterValueRow()

    if(levyYear.isPresent()) {
      erParameterValueRow.LevyYear = levyYear.AsInt
    }

    if(paramCode.Present) {
      paramCode.each(\value -> {
        erParameterValueRow.Code = value
      })
    }

    if(paramValue.Present) {
      paramValue.each(\value -> {
        erParameterValueRow.Value = value
      })
    }

    if (parseErrors.HasElements) {
      return Either.left(parseErrors)
    } else {
      return Either.right(erParameterValueRow)
    }
  }

  private function validateRowData() : List<FieldValidationError> {
    var errors : LinkedList<FieldValidationError> = {}

    if (!levyYear.isPresent()) {
      errors.add(new FieldValidationError("LevyYear is required"))
    }

    if (!paramCode.isPresent()) {
      errors.add(new FieldValidationError("ParamCode is required"))
    }

    if (!paramValue.isPresent()) {
      errors.add(new FieldValidationError("ParamValue is required"))
    }

    return errors
  }
}