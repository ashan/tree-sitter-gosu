package nz.co.acc.common.integration.bulkupload.csvrowparser

uses edge.util.either.Either
uses gw.pl.util.csv.CSVParser
uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError
uses nz.co.acc.common.integration.bulkupload.fieldparser.IFieldParser

/**
 * Interface for processing a single CSV row
 * Created by OurednM on 18/06/2018.
 */
interface IRowParser<RowType> {
  function parseRow(csvParser: CSVParser): Either<List<FieldValidationError>, RowType>

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
}