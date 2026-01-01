package nz.co.acc.gwer.bulkupload.parser

uses edge.util.either.Either
uses gw.api.locale.DisplayKey
uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError
uses nz.co.acc.common.integration.bulkupload.fieldparser.DateParser
uses org.apache.poi.ss.usermodel.Cell
uses org.apache.poi.ss.usermodel.CellType
uses java.text.SimpleDateFormat
uses java.util.Date

class DateXLSCellParser implements IXLSCellParser<Date> {
  // Apache POI Cell object holds:
  // XLS Date cell in the format 15-Sep-2022 (CellType = NUMERIC) and
  // XLS General cell with text date as is (CellType = STRING).
  private final static var XLS_DATE_CELL_FORMAT = "dd-MMM-yyyy"
  public construct() {
  }
  override function parse(cell : Cell) : Either<FieldValidationError, Date> {
    if (cell == null) return Either.left((new FieldValidationError(DisplayKey.get("Web.Experiencerating.BulkUpload.XLS.NullCell"))))
    var cellType = cell.CellType
    var cellStrVal = cell.toString()

    switch (cellType) {
      case CellType.NUMERIC: {
        var date: Date = null
        var df = new SimpleDateFormat(XLS_DATE_CELL_FORMAT)
        df.setLenient(false)
        try {
          date = df.parse(cellStrVal)
        } catch (e: Exception) {} //not required to handle
        return (date != null) ? Either.right(date) : Either.left(new FieldValidationError(DisplayKey.get("Web.Experiencerating.BulkUpload.XLS.InvalidDateErr1", cellStrVal, columnLetter(cell.ColumnIndex))))
      }
      case CellType.STRING: {
        var date = new DateParser().parse(cell.StringCellValue)
        return date.isRight ? Either.right(date.right) : Either.left(date.left)
      }
      default: {
        return Either.left(new FieldValidationError(DisplayKey.get("Web.Experiencerating.BulkUpload.XLS.InvalidDateErr2",
            cellType, cellStrVal, cell.ColumnIndex)))
      }
    }
  }


}