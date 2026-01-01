package gw.command

uses gw.command.DefaultMethod
uses gw.api.system.PCLoggerCategory

/**
 * ACC Intraday Batch Process.
 */
@Export
@DefaultMethod("Intraday")
class ACCBatchProcess_Intraday extends PCBaseCommand {

  function Intraday() {
    PCLoggerCategory.SERVER_BATCHPROCESS.info("ACCBatchProcess_Intraday started")
    runBatch(BatchProcessType.TC_UPDATEIRINBOUNDWORKQUEUESTATS_ACC)
    runBatch(BatchProcessType.TC_ACTIVITYESC)
    runBatch(BatchProcessType.TC_TEAMSCREENS)
    runBatch(BatchProcessType.TC_WORKFLOW)
    PCLoggerCategory.SERVER_BATCHPROCESS.info("ACCBatchProcess_Intraday finished")
  }

}