package nz.co.acc.common.integration.bulkupload

uses gw.api.database.IQueryBeanResult
uses gw.api.database.Query
uses gw.api.database.QuerySelectColumns
uses gw.api.database.Relop
uses gw.api.path.Paths
uses gw.api.util.DateUtil
uses gw.api.util.DisplayableException
uses gw.api.web.WebFile
uses gw.api.web.WebUtil
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.util.CompressionUtil
uses nz.co.acc.plm.integration.bulkupload.BulkUploader


uses java.io.BufferedInputStream
uses java.io.ByteArrayInputStream
uses java.io.File
uses java.io.FileOutputStream
uses java.util.concurrent.ExecutorService
uses java.util.concurrent.Executors

/**
 * Helper for BulkUpload UI
 * <p>
 * Created by OurednM on 13/06/2018.
 */
class BulkUploaderUIHelper {
  private static var _log = StructuredLogger.INTEGRATION.withClass(BulkUploaderUIHelper)

  protected static var executor : ExecutorService = Executors.newWorkStealingPool(10)

  protected var _selectedFile : WebFile as SelectedFile
  protected var _selectedUploadType : BulkUploadType_ACC as SelectedUploadType = BulkUploadType_ACC.AllTypeKeys.first()

  private var _searchResult : IQueryBeanResult<BulkUploadProcess_ACC>as SearchResult
  private var _searchDateFrom : Date as SearchDateFrom
  private var _searchDateTo : Date as SearchDateTo

  construct() {
    _searchDateFrom = DateUtil.currentDate().addDays(-14)
    _searchDateTo = DateUtil.currentDate()
    executeSearch()
  }

  public function executeSearch() {

    var startDate = new Calendar.Builder()
        .setDate(_searchDateFrom.YearOfDate, _searchDateFrom.MonthOfYear - 1, _searchDateFrom.DayOfMonth)
        .setTimeOfDay(0, 0, 0)
        .build().getTime()

    var endDate = new Calendar.Builder()
        .setDate(_searchDateTo.YearOfDate, _searchDateTo.MonthOfYear - 1, _searchDateTo.DayOfMonth)
        .setTimeOfDay(23, 59, 59)
        .build().getTime()

    SearchResult = Query.make(BulkUploadProcess_ACC)
        .compare(BulkUploadProcess_ACC#CreateTime, Relop.GreaterThanOrEquals, startDate)
        .or(\orCriteria -> {

          // If finishTime is null then bulkupload process is still running.
          // Filter out any running processes which started after the filtered end date.
          orCriteria.and(\andCriteria -> {
            andCriteria.compare(BulkUploadProcess_ACC#finishTime, Relop.Equals, null)
            andCriteria.compare(BulkUploadProcess_ACC#CreateTime, Relop.LessThanOrEquals, endDate)
          })

          orCriteria.compare(BulkUploadProcess_ACC#finishTime, Relop.LessThanOrEquals, endDate)
        })
        .select()

    SearchResult.orderByDescending(QuerySelectColumns.path(Paths.make(BulkUploadProcess_ACC#CreateTime)))
  }

  public function executeBulkUpload() {

    if (_selectedFile == null) {
      return
    }

    if (!(_selectedFile.Name.endsWithIgnoreCase(".txt") || _selectedFile.Name.endsWithIgnoreCase(".csv"))) {
      throw new DisplayableException("File type must be .txt or .csv")
    }

    var tmpFile = copyWebFileToFile(_selectedFile)

    var bulkUploader = new BulkUploader(tmpFile, _selectedFile.Name, _selectedUploadType)

    try {
      executor.submit(\-> bulkUploader.run())
    } catch (e : Exception) {
      throw new DisplayableException("Bulk uploader can not be scheduled for execution", e)
    }
  }

  function downloadValidationErrors(bulkUploadProcess : BulkUploadProcess_ACC) {
    var errorBlob = bulkUploadProcess.validationErrors
    if (errorBlob != null) {
      var value = CompressionUtil.decompress(bulkUploadProcess.validationErrors.Bytes)
      var input = new ByteArrayInputStream(value)
      WebUtil.copyStreamToClient("application/text", "BulkUploadValidationErrors_${bulkUploadProcess.ID.toString()}.txt", input, value.length)
    }
  }

  function downloadProcessErrors(bulkUploadProcess : BulkUploadProcess_ACC) {
    var errorBlob = bulkUploadProcess.processErrors
    if (errorBlob != null) {
      var value = CompressionUtil.decompress(bulkUploadProcess.processErrors.Bytes)
      var input = new ByteArrayInputStream(value)
      WebUtil.copyStreamToClient("application/text", "BulkUploadProcessErrors_${bulkUploadProcess.ID.toString()}.txt", input, value.length)
    }
  }

  function copyWebFileToFile(webFile : WebFile) : File {
    final var fn = "copyWebFileToFile"

    var tmpFile = File.createTempFile("policycenter-bulkuploader", "csv")
    var bos : FileOutputStream
    var bis : BufferedInputStream

    try {
      bos = new FileOutputStream(tmpFile)
      bis = new BufferedInputStream(webFile.InputStream)
      var ba = new byte[2048]
      var count = bis.read(ba)
      while (count > 0) {
        bos.write(ba, 0, count)
        count = bis.read(ba)
      }
      return tmpFile

    } catch (e : Exception) {
      logError(fn, "Failed to process uploaded file", e)
      throw new DisplayableException("Failed to process uploaded file: " + e.toString())

    } finally {
      bis?.close()
      bos?.close()
    }
  }

  function logError(fn : String, msg : String) {
    _log.error_ACC(msg)
  }

  function logError(fn : String, msg : String, e : Exception) {
    _log.error_ACC(msg, e)
  }
}