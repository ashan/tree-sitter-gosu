package nz.co.acc.gwer.bulkupload.xlsprocessor

uses gw.api.util.DisplayableException
uses gw.surepath.suite.integration.logging.StructuredLogger_ACC
uses nz.co.acc.common.integration.bulkupload.csvrowparser.IRowParser
uses nz.co.acc.gwer.bulkupload.ERBulkUploadProcessUpdater
uses nz.co.acc.gwer.bulkupload.error.XLSRowProcessError
uses org.apache.poi.ss.usermodel.Sheet
uses org.apache.poi.xssf.usermodel.XSSFWorkbook

uses java.io.File
uses java.io.FileInputStream
uses java.lang.reflect.InvocationTargetException


/**
 * Created by OurednM on 25/06/2018.
 */
abstract class AbstractXLSProcessor {
  private var _rowParser : IRowParser
  protected var _updater : ERBulkUploadProcessUpdater
  protected var _uploadFile : File
  protected var _workBook : XSSFWorkbook
  private var _isProcessed : Boolean
  protected static var _log: StructuredLogger_ACC
  private var _ftpUploaded : Boolean
  protected var xlsProcessResults : List<XLSProcessorResult>

  construct(updater : ERBulkUploadProcessUpdater, uploadFile : File) {
    this._updater = updater
    this._uploadFile = uploadFile
    this._isProcessed = false
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

  function processWorkbook() : XLSProcessorResult {
    var rowProcessErrors = new ArrayList<XLSRowProcessError>()
    var sheetNames = _workBook.NumberOfSheets
    _log.info("Number of Sheets ${_workBook.NumberOfSheets}")
    var results = new ArrayList<XLSProcessorResult>()
    for (sheet in _workBook.sheetIterator()) {
      var processor = getSheetProcessor(sheet)
      if(processor != null) {
        results.add(processor.processSheet())
      }
    }
    _updater.finish(results)
    return new XLSProcessorResult(0, rowProcessErrors, null)
  }

  abstract function getSheetProcessor(sheet : Sheet) : AbstractXLSSheetProcessor

  property set IsFTPUploaded(ftpUploaded:Boolean) {
    _ftpUploaded = ftpUploaded
  }

  public function loadWorkbookFromFile() : XSSFWorkbook {
    try {
      var inputFile = new File(_uploadFile.getAbsolutePath())
      //noinspection IOResourceOpenedButNotSafelyClosed An object using this stream is returned by the function
      var inputStream = new FileInputStream(inputFile)
      _log.info("createXLSWorkbook :: loading the file ${_uploadFile.Name}")
      _workBook = new XSSFWorkbook(inputStream)
    } catch (e : InvocationTargetException) {
      //      _log.error_ACC("Failed to open File ${_uploadFile.getCanonicalPath()}", e)
      e.printStackTrace()
      _log.error_ACC("createXLSWorkbook", e)
      throw new DisplayableException(e.Message)
    } catch (e : RuntimeException) {
      //      _log.error_ACC("Failed to open File ${_uploadFile.getCanonicalPath()}", e)
      e.printStackTrace()
      _log.error_ACC("createXLSWorkbook", e)
      throw new DisplayableException(e.Message)
    } catch (e : Exception) {
      //      _log.error_ACC("Failed to open File ${_uploadFile.getCanonicalPath()}", e)
      e.printStackTrace()
      _log.error_ACC("createXLSWorkbook", e)
      throw new DisplayableException(e.Message)
    }

    return _workBook
  }
}