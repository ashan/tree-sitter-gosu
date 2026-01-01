package nz.co.acc.gwer.bulkupload.xlsprocessor

uses nz.co.acc.gwer.bulkupload.error.XLSRowProcessError
uses nz.co.acc.common.integration.bulkupload.error.RowValidationError

/**
 * Created by OurednM on 26/06/2018.
 */
class XLSProcessorResult {
  var _numSuccessfulRows: Integer as readonly NumSuccessfulRows
  var _rowProcessErrors: List<XLSRowProcessError>as readonly RowProcessErrors
  var _rowValidationErrors: List<RowValidationError>as readonly RowParseErrors
  var _comment : String
  public construct(rowValidationErrors: List<RowValidationError>) {
    this._numSuccessfulRows = 0
    this._rowProcessErrors = {}
    this._rowValidationErrors = rowValidationErrors
  }

  public construct(numSuccessfulRows: Integer, rowProcessErrors: List<XLSRowProcessError>, comment : String) {
    this._numSuccessfulRows = numSuccessfulRows
    this._rowProcessErrors = rowProcessErrors
    this._rowValidationErrors = {}
    this._comment = comment
  }

  public property get ParseErrorsAsString() : String {
    return RowParseErrors.join("\r\n")
  }

  public property get ProcessErrorsAsString() : String {
    return RowProcessErrors.join("\r\n")
  }

}