package nz.co.acc.gwer.bulkupload.parser

uses edge.util.either.Either
uses gw.api.locale.DisplayKey
uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError
uses org.apache.poi.ss.usermodel.Cell
uses org.apache.poi.ss.usermodel.CellType
//Apache POI Cell object holds Numeric cell value as Double even if it looks like integer in Excel
class NumericXLSCellParser implements IXLSCellParser<Double> {

  override function parse(cell : Cell) : Either<FieldValidationError, Double> {
    if (cell.CellType != CellType.NUMERIC) {
      return Either.left(new FieldValidationError(DisplayKey.get("Web.Experiencerating.BulkUpload.XLS.InvalidNumericValErrMsg", cell.CellType, cell.toString(), columnLetter(cell.ColumnIndex))))
    }
    return Either.right(cell.NumericCellValue)
  }
}