package nz.co.acc.gwer.bulkupload

uses gw.surepath.suite.integration.logging.StructuredLogger_ACC
uses nz.co.acc.common.integration.bulkupload.BulkUploadProcessUpdater
uses gw.api.util.DateUtil
uses nz.co.acc.common.util.CompressionUtil
uses nz.co.acc.gwer.bulkupload.xlsprocessor.XLSProcessorResult

class ERBulkUploadProcessUpdater extends BulkUploadProcessUpdater {
  private static var _log: StructuredLogger_ACC
  construct(filename : String, bulkUploadType : BulkUploadType_ACC) {
    super(filename, bulkUploadType)
    _log = StructuredLogger_ACC.CONFIG.withClass(ERBulkUploadProcessUpdater)
  }

  function finish(results : List<XLSProcessorResult>) {
    var bulkUploadProcess = getBulkUploadProcess()

    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      bulkUploadProcess = bundle.add(bulkUploadProcess)
      var validationsErrors = new StringBuilder()
      var processErrors = new StringBuilder()
      bulkUploadProcess.validationErrorCount = 0
      bulkUploadProcess.successCount = 0
      bulkUploadProcess.failureCount = 0
      bulkUploadProcess.csvRowCount = 0

      if(results.HasElements) {
        bulkUploadProcess.successCount = results*.NumSuccessfulRows.sum()
        results*.RowProcessErrors.each(\elt -> {
          bulkUploadProcess.failureCount += elt.Count
        })

        results*.RowParseErrors.each(\elt -> {
          bulkUploadProcess.validationErrorCount += elt.Count
        })

        bulkUploadProcess.csvRowCount = bulkUploadProcess.failureCount + bulkUploadProcess.successCount

        for (result in results) {
          //bulkUploadProcess.comment = result.Comment
          if (result.RowParseErrors.HasElements) {
            validationsErrors.append(result.ParseErrorsAsString + System.lineSeparator())
          }
          if (result.RowProcessErrors.HasElements) {
            processErrors.append(result.ProcessErrorsAsString + System.lineSeparator())
          }
        }
      }

      if(!validationsErrors.isEmpty()) {
        bulkUploadProcess.validationErrors = CompressionUtil.compressStringToBlob(validationsErrors.toString())
      }

      if(!processErrors.isEmpty()) {
        bulkUploadProcess.validationErrors = CompressionUtil.compressStringToBlob(processErrors.toString())
      }

      _log.info("Success Count ${bulkUploadProcess.successCount}")
      if (bulkUploadProcess.successCount == 0) {
        bulkUploadProcess.status = BulkUploadProcessStatus_ACC.TC_FAILED
      } else {
        bulkUploadProcess.status = BulkUploadProcessStatus_ACC.TC_FINISHED
      }

      bulkUploadProcess.finishTime = DateUtil.currentDate()
    })
  }
}