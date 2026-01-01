package nz.co.acc.gwer.bulkupload.error

/**
 * An error that occurred when processing a row
 *
 * Created by OurednM on 18/06/2018.
 */
class XLSRowProcessError extends Exception {
  private var _sheetName : String as readonly SheetName
  private var _lineNumber : int as readonly RowNumber
  private var _error: String as readonly Error

  construct(sheetName : String, lineNumber: int, error: String) {
    super("Sheet name ${sheetName}, Line ${lineNumber}: ${error}")
    this._sheetName = sheetName
    this._lineNumber = lineNumber
    this._error = error
  }

  override function toString(): String {
    return "Sheet name ${_sheetName}, Line ${_lineNumber}: ${_error}"
  }

}