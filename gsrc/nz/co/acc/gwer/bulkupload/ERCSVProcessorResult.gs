package nz.co.acc.gwer.bulkupload

uses nz.co.acc.common.integration.bulkupload.csvprocessor.CSVProcessorResult
uses nz.co.acc.common.integration.bulkupload.error.RowProcessError
uses nz.co.acc.common.integration.bulkupload.error.RowValidationError

class ERCSVProcessorResult extends CSVProcessorResult {

  var _comment : String as readonly Comment

  public construct(numSuccessfulRows: Integer, rowProcessErrors: List<RowProcessError>, comment : String) {
    super(numSuccessfulRows, rowProcessErrors)
    this._comment = comment
  }
}