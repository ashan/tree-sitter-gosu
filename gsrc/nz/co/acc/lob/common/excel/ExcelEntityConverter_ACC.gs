package nz.co.acc.lob.common.excel

uses gw.validation.PCValidationResult
uses org.apache.poi.ss.usermodel.Row
uses org.apache.poi.ss.usermodel.Sheet
uses org.apache.poi.ss.usermodel.Workbook

/**
 * Methods to convert entities to and from spreadsheet rows.
 */
interface ExcelEntityConverter_ACC<T> {

  /**
   * Return the validation errors
   * @return
   */
  public function getPCValidationResult() : PCValidationResult

  /**
   * The file name prefix for the xlsx file
   * @return
   */
  public function getFileName() : String

  /**
   * The work sheet name. Used to validate the imported file is the expected one.
   * @return
   */
  public function getSheetName() : String

  /**
   * A list of the title headings
   * @return
   */
  public function getHeadings() : List<String>

  /**
   * Parse the spreadsheet row into a data object.
   * @param row the spreadsheet row
   * @return the data object
   */
  public function parseRow(row : Row, rowNumber : Integer) : ExcelRow

  /**
   * Update or insert the spreadsheet data on import
   * @param row the spreadsheet row
   */
  public function updateOrInsertEntity(row : Row, rowNumber : Integer)

  /**
   * Validate the spreadsheet data on import
   * @param row the spreadsheet row
   */
  public function validateRow(row : Row, rowNumber : Integer)

  /**
   * Add the entity data to the spreadsheet for export.
   * @param entity the entity
   * @param workbook the Excel workbook
   * @param sheet the Excel work sheet
   * @param rowNumber the current row number
   */
  public function addEntityToSheet(entity : T, workbook : Workbook, sheet : Sheet, rowNumber : Integer)
}