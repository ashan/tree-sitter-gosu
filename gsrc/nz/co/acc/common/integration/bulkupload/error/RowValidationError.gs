package nz.co.acc.common.integration.bulkupload.error

/**
 * A list of errors when parsing a CSV row.
 *
 * Created by OurednM on 18/06/2018.
 */
class RowValidationError {

  private var _rowNumber: int as readonly RowNumber
  private var _fieldValidationErrors: List<FieldValidationError>as readonly ValidationErrors

  construct(rowNumber: int, fieldValidationErrors: List<FieldValidationError>) {
    this._rowNumber = rowNumber
    this._fieldValidationErrors = fieldValidationErrors
  }

  construct(rowNumber: int, error: String) {
    this._rowNumber = rowNumber
    this._fieldValidationErrors = {new FieldValidationError(error)}
  }

  override function toString(): String {
    return "Line ${_rowNumber}: ${_fieldValidationErrors.map(\validationError -> validationError.Message).join("; ")}"
  }
}