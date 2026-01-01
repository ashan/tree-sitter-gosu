package nz.co.acc.common.integration.bulkupload

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.api.util.DateUtil
uses gw.pl.persistence.core.Bundle
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.integration.bulkupload.csvprocessor.CSVProcessorResult
uses nz.co.acc.common.util.CompressionUtil

/**
 * Updates bulk upload process status in database
 * Created by Mike Ourednik on 18/01/2019.
 */
class BulkUploadProcessUpdater {
  private var _bulkUploadUUID: String
  private var _numSuccesses: int as readonly NumSuccesses
  private var _numFailures: int
  private final var _progressUpdateInterval = 100
  private var _bulkUploadProcess : BulkUploadProcess_ACC

  private static var _log  = StructuredLogger.CONFIG.withClass(BulkUploadProcessUpdater)

  construct(filename: String, bulkUploadType: BulkUploadType_ACC) {
    _bulkUploadUUID = UUID.randomUUID().toString()
    _bulkUploadProcess = new BulkUploadProcess_ACC()

    _bulkUploadProcess.uuid = _bulkUploadUUID
    _bulkUploadProcess.uploadUser = User.util.CurrentUser != null ? User.util.CurrentUser : User.util.UnrestrictedUser
    _bulkUploadProcess.uploadType = bulkUploadType
    _bulkUploadProcess.status = BulkUploadProcessStatus_ACC.TC_STARTED
    _bulkUploadProcess.filename = filename
  }

  function getUUID(): String {
    return _bulkUploadUUID
  }

  function updateProgressCounters(rowSuccessful: Boolean) {

    if (rowSuccessful) {
      _numSuccesses += 1
    } else {
      _numFailures += 1
    }

    if ((_numSuccesses + _numFailures) % _progressUpdateInterval == 0) {
      var bulkUploadProcess = getBulkUploadProcess()
      gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
        bulkUploadProcess = bundle.add(bulkUploadProcess)
        bulkUploadProcess.successCount = _numSuccesses
        bulkUploadProcess.failureCount = _numFailures
      })
    }
  }

  function updateRowCount(rowCount: int) {
    final var fn = "updateRowCount"

    var bulkUploadProcess = getBulkUploadProcess()

    logInfo(fn, "updating row")

    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      bulkUploadProcess = bundle.add(bulkUploadProcess)
      bulkUploadProcess.csvRowCount = rowCount
    })
  }

  function finish(result: CSVProcessorResult) {
    final var fn = "finish"

    var bulkUploadProcess = getBulkUploadProcess()

    logInfo(fn, "updating row")

    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      bulkUploadProcess = bundle.add(bulkUploadProcess)

      if (bulkUploadProcess.successCount == 0) {
        bulkUploadProcess.status = BulkUploadProcessStatus_ACC.TC_FAILED
      } else {
        bulkUploadProcess.status = BulkUploadProcessStatus_ACC.TC_FINISHED
      }

      bulkUploadProcess.successCount = result.NumSuccessfulRows
      bulkUploadProcess.failureCount = result.RowProcessErrors.Count
      bulkUploadProcess.validationErrorCount = result.RowParseErrors.Count
      if (result.RowParseErrors.HasElements) {
        bulkUploadProcess.validationErrors = CompressionUtil.compressStringToBlob(result.getParseErrorsAsString())
      }
      if (result.RowProcessErrors.HasElements) {
        bulkUploadProcess.processErrors = CompressionUtil.compressStringToBlob(result.getProcessErrorsAsString())
      }
      bulkUploadProcess.finishTime = DateUtil.currentDate()

    })
  }

  function finishWithInvalidCSV(error: String) {
    final var fn = "finishWithInvalidCSV"

    var bulkUploadProcess = getBulkUploadProcess()

    logInfo(fn, "updating row")

    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      bulkUploadProcess = bundle.add(bulkUploadProcess)
      bulkUploadProcess.status = BulkUploadProcessStatus_ACC.TC_FAILED
      bulkUploadProcess.finishTime = DateUtil.currentDate()
      bulkUploadProcess.validationErrors = CompressionUtil.compressStringToBlob(error)
      bulkUploadProcess.validationErrorCount = 1
      bulkUploadProcess.uploadUser = User.util.CurrentUser

    })
  }

  protected function getBulkUploadProcess(): BulkUploadProcess_ACC {
    final var fn = "getBulkUploadProcess"

    logInfo(fn, "Executing query..")

    var result: BulkUploadProcess_ACC = null
    var retries = 0

    while (result == null && retries < 3) {
      result = Query.make(BulkUploadProcess_ACC)
          .compare(BulkUploadProcess_ACC#uuid, Relop.Equals, _bulkUploadUUID)
          .select().FirstResult
      if (result == null && retries < 3) {
        retries += 1
        logInfo(fn, "Row not found in database. Waiting 1 second before retry #${retries}")
        Thread.sleep(1000)
      }
    }

    logInfo(fn, "Found result ${result}")

    if(result == null) {
      result = _bulkUploadProcess
    }

    return result
  }

  function logInfo(fn: String, msg: String) {
    _log.info("fn=${fn} BulkUploadUUID=${_bulkUploadUUID}: ${msg}")
  }
}