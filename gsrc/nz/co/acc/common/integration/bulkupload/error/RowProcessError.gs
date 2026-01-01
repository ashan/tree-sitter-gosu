package nz.co.acc.common.integration.bulkupload.error

/**
 * An error that occurred when processing a row
 *
 * Created by OurednM on 18/06/2018.
 */
class RowProcessError extends Exception {

  private var _lineNumber : int as readonly RowNumber
  private var _error: String as readonly Error

  construct(lineNumber: int, error: String) {
    super("Line ${lineNumber}: ${error}")
    this._lineNumber = lineNumber
    this._error = error
  }

  override function toString(): String {
    return "Line ${_lineNumber}: ${_error}"
  }

}