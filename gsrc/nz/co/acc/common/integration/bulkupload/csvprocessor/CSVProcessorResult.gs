package nz.co.acc.common.integration.bulkupload.csvprocessor

uses nz.co.acc.common.integration.bulkupload.error.RowValidationError
uses nz.co.acc.common.integration.bulkupload.error.RowProcessError

/**
 * Created by OurednM on 26/06/2018.
 */
class CSVProcessorResult {
  var _numSuccessfulRows: Integer as readonly NumSuccessfulRows
  var _rowProcessErrors: List<RowProcessError>as readonly RowProcessErrors
  var _rowValidationErrors: List<RowValidationError>as readonly RowParseErrors

  public construct(rowValidationErrors: List<RowValidationError>) {
    this._numSuccessfulRows = 0
    this._rowProcessErrors = {}
    this._rowValidationErrors = rowValidationErrors
  }

  public construct(numSuccessfulRows: Integer, rowProcessErrors: List<RowProcessError>) {
    this._numSuccessfulRows = numSuccessfulRows
    this._rowProcessErrors = rowProcessErrors
    this._rowValidationErrors = {}
  }

  public function getParseErrorsAsString(): String {
    return RowParseErrors.join("\r\n")
  }

  public function getProcessErrorsAsString(): String {
    return RowProcessErrors.join("\r\n")
  }

}