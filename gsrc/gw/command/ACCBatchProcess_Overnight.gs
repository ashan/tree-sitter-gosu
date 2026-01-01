package gw.command

uses gw.command.DefaultMethod
uses gw.api.system.PCLoggerCategory

/**
 * ACC Overnight Batch Process.
 */
@Export
@DefaultMethod("Overnight")
class ACCBatchProcess_Overnight extends PCBaseCommand {

  function Overnight() {
    PCLoggerCategory.SERVER_BATCHPROCESS.info("ACCBatchProcess_Overnight started")
    runBatch(BatchProcessType.TC_POLICYRENEWALSTART)
    runBatch(BatchProcessType.TC_ACTIVITYRETIRE)
    runBatch(BatchProcessType.TC_APPLYPENDINGACCOUNTDATAUPDATES)
    runBatch(BatchProcessType.TC_WPCREFUNDPROVISIONALLEVIES_ACC)
    runBatch(BatchProcessType.TC_JOBEXPIRE)
    runBatch(BatchProcessType.TC_OUTBOUNDMAILHOUSELETTERSFILE_ACC)
    PCLoggerCategory.SERVER_BATCHPROCESS.info("ACCBatchProcess_Overnight finished")
  }

}