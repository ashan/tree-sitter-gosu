package nz.co.acc.common.integration.files.outbound

/**
 * Encapsulates extensions for the OutBoundHeader_ACC.gs.
 *
 * Created by Nick on 9/01/2017.
 */
enhancement OutBoundHeaderExt_ACC: OutBoundHeader_ACC {


  function initialState(batchProcessType: BatchProcessType) {
    this.BatchType = batchProcessType.getCode()
    this.Status = OutBoundHeaderStatus_ACC.TC_INITIATED
  }

  function completed() {
    this.Status = OutBoundHeaderStatus_ACC.TC_COMPLETED
    this.CompletedTime = new Date()
  }

  function completed(fileName:String, stats:FileStatistics) {
    this.FileName = fileName
    this.NumOfErrors = stats.NumOfRecordsErrored
    this.NumOfProcessed = stats.NumOfRecordsProcessed
    this.HashTotal = stats.HashTotal
    this.TotalAmount = stats.TotalAmount
    this.Status = OutBoundHeaderStatus_ACC.TC_COMPLETED
    this.CompletedTime = new Date()
  }

  function converted(numOfRecordsConvertedSuccessfully:int, numOfRecordsConversionErrored:int, numOfRecordsWithInvalidAddress:int) {
    this.ConvertedTime = new Date()
    this.NumRecordsConverted = numOfRecordsConvertedSuccessfully
    this.NumRecordsErroredConversion = numOfRecordsConversionErrored
    this.NumRecordsInvalidAddress = numOfRecordsWithInvalidAddress
    this.Status = OutBoundHeaderStatus_ACC.TC_PROCESSING
  }

  function errored(stats:FileStatistics) {
    this.NumOfErrors = stats.NumOfRecordsErrored
    this.NumOfProcessed = stats.NumOfRecordsProcessed
    this.Status = OutBoundHeaderStatus_ACC.TC_ERRORED
    this.CompletedTime = new Date()
  }
}
