package nz.co.acc.gwer.bulkupload.xlsprocessor

uses gw.surepath.suite.integration.logging.StructuredLogger_ACC
uses nz.co.acc.common.integration.bulkupload.BulkUploadProcessUpdater
uses nz.co.acc.common.integration.bulkupload.csvrowparser.IRowParser
uses org.apache.poi.ss.usermodel.Cell
uses org.apache.poi.ss.usermodel.Sheet
uses org.apache.poi.xssf.usermodel.XSSFWorkbook
uses nz.co.acc.gwer.bulkupload.error.XLSRowProcessError
uses java.io.File
uses java.io.FileInputStream
uses gw.api.locale.DisplayKey

/**
 * Created by OurednM on 25/06/2018.
 */
abstract class AbstractXLSSheetProcessor {
  private var _rowParser : IRowParser
  protected var _updater : BulkUploadProcessUpdater
  protected var _uploadFile : File
  protected var _sheet : Sheet
  private var _isProcessed : Boolean
  protected static var _log : StructuredLogger_ACC
  private var _ftpUploaded : Boolean

  construct(updater : BulkUploadProcessUpdater, sheet : Sheet) {
    this._updater = updater
    this._isProcessed = false
    this._sheet = sheet
  }

  construct() {
    // NTK-7937 added for GUnit testing of extended class
  }

  protected function onSuccess() {
    _updater.updateProgressCounters(true)
  }

  protected function onFailure() {
    _updater.updateProgressCounters(false)
  }

  protected property get NumSuccesses() : Integer {
    return _updater.NumSuccesses
  }

  abstract property get SheetName() : String

  function processSheet() : XLSProcessorResult {
    _log.info("Sheet processing started ${SheetName}")
    var rowsSuccessful = 0
    var lineNumber = 1
    var recordNumber = 0

    var rowProcessErrors = new ArrayList<XLSRowProcessError>()
    if (_sheet != null) {
      try {
        var rowIterator = _sheet.rowIterator()
        if (rowIterator.hasNext()) {
          validateHeaders(rowIterator.next().toList().map(\cell -> cell.toString()))
          _log.info(DisplayKey.get("Web.Experiencerating.BulkUpload.XLS.ColumnsHeadersValidationSuccessInfoMsg"))
          lineNumber += 1
          while (rowIterator.hasNext()) {
            var row = rowIterator.next()
            var cellIterator = row.cellIterator()
            if (cellIterator.hasNext()) {
              var list = cellIterator.toList()
              _log.info("processSheet cell count ${list.Count}")
              var empty = list.hasMatch(\elt -> elt.CellType == BLANK)
              if (list.HasElements and !empty) {
                try {
                  processRow(list)
                  rowsSuccessful += 1
                  onSuccess()
                } catch (e : Exception) {
                  _log.error_ACC("processSheet error row processing", e)
                  rowProcessErrors.add(new XLSRowProcessError(SheetName, lineNumber, e.Message))
                  onFailure()
                }
              } else {
                _log.error_ACC("processSheet row has empty cells")
                onFailure()
              }
            }
            lineNumber += 1
          }
        }
      } catch (e : Exception) {
        _log.error_ACC("processSheet error on sheet processing", e)
        rowProcessErrors.add(new XLSRowProcessError(SheetName, lineNumber, e.Message))
        onFailure()
      }
    } else {
      _log.error_ACC("Sheet is NULL")
    }
    _log.info("Sheet processing done ${SheetName}")
    return new XLSProcessorResult(rowsSuccessful, rowProcessErrors, null)
  }

  public function processWorkbook() : XLSProcessorResult {
    var workBook = createXLSWorkbook()
    return null
  }

  abstract function processRow(list : List<Cell>)

  property set IsFTPUploaded(ftpUploaded : Boolean) {
    _ftpUploaded = ftpUploaded
  }

  function validateHeaders(headers : List<String>) {}

  protected function createXLSWorkbook() : XSSFWorkbook {
    try {
      return new XSSFWorkbook(new FileInputStream(_uploadFile))
    } catch (e : Exception) {
      _log.error_ACC("Failed to open File ${_uploadFile.getCanonicalPath()}", e)
      return null
    }
  }
}