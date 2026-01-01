package nz.co.acc.gwer.batch

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.processes.BatchProcessBase
uses gw.surepath.suite.integration.logging.StructuredLogger_ACC
uses gw.webservice.pc.pc1000.MaintenanceToolsAPI

class ERRunBatches_ACC extends BatchProcessBase {
  private static var _logger = StructuredLogger_ACC.CONFIG.withClass(ERRunBatches_ACC)
  construct() {
    super(BatchProcessType.TC_ERRUNBATCHES_ACC)
  }

  protected override function doWork() {
    runAndMonitorBatchProcess(BatchProcessType.TC_ERPROCESSRUNREQUEST_ACC)
    runAndMonitorWorkqueue(BatchProcessType.TC_ERGENERATELEVYPAYERS_ACC)
    runAndMonitorWorkqueue(BatchProcessType.TC_ERGENERATEPOLICYDETAILS_ACC)
    runAndMonitorWorkqueue(BatchProcessType.TC_ERTRANSFERPOLICYDETAILS_ACC)
    runAndMonitorWorkqueue(BatchProcessType.TC_ERDETERMINEERELIGIBILITY_ACC)
    runAndMonitorWorkqueue(BatchProcessType.TC_ERDETERMINENCDELIGIBILITY_ACC)
    runAndMonitorWorkqueue(BatchProcessType.TC_ERGENERATECLAIMDETAILS_ACC)
    runAndMonitorWorkqueue(BatchProcessType.TC_ERTRANSFERCLAIMDETAILS_ACC)
    runAndMonitorWorkqueue(BatchProcessType.TC_ERPRECALCLRGCOMP_ACC)
    runAndMonitorWorkqueue(BatchProcessType.TC_ERCALCULATEERRATE_ACC)
    runAndMonitorWorkqueue(BatchProcessType.TC_ERCALCULATENCDRATE_ACC)
//    runAndMonitorWorkqueue(BatchProcessType.TC_ERAPPLYRATETOPOLICY_ACC)
    updateRequestRunsToCompleted()
  }

  function runAndMonitorBatchProcess(batchprocessType :BatchProcessType) {
    var continueChecking = true
    var maintenanceToolsAPI = new MaintenanceToolsAPI()
    var processID = maintenanceToolsAPI.startBatchProcess(batchprocessType.Code)
    print(Date.CurrentDate.toISOTimestamp() + " |Start:" + batchprocessType.toString())
    do {
      var jobStatus = maintenanceToolsAPI.batchProcessStatusByID(processID)
      if(!jobStatus.Complete) {
        Thread.sleep(5000)
      } else {
        continueChecking = false
      }
    } while(continueChecking)
    print(Date.CurrentDate.toISOTimestamp() + " |End:" + batchprocessType.toString())
  }

  function runAndMonitorWorkqueue(batchprocessType :BatchProcessType) {
    var continueChecking = true
    var maintenanceToolsAPI = new MaintenanceToolsAPI()
    var processID = maintenanceToolsAPI.startBatchProcess(batchprocessType.Code)
    print(Date.CurrentDate.toISOTimestamp() + " |Start:" + batchprocessType.toString())
    do {
      var processStatus = maintenanceToolsAPI.batchProcessStatusByID(processID)
      var queueStatus = maintenanceToolsAPI.getWQueueStatus(batchprocessType.Code)
      if(queueStatus.getNumActiveWorkItems() > 0 or !processStatus.Complete) {
        Thread.sleep(5000)
      } else {
        continueChecking = false
      }
    } while(continueChecking)
    print(Date.CurrentDate.toISOTimestamp() + " |End:" + batchprocessType.toString())
  }

  function updateRequestRunsToCompleted() {
    var runQuery = Query.make(ERRun_ACC)
    runQuery.compare(ERRun_ACC#ERRunStatus, Relop.Equals, ERRunStatus_ACC.TC_INPROGRESS)
    var requestQuery = runQuery.join(ERRun_ACC#ERRequest)
    requestQuery.compare(ERRequest_ACC#ERRequestStatus, Relop.Equals, ERRequestStatus_ACC.TC_APR)
    var results = runQuery.select()
    if(results.HasElements) {
      var bundle = gw.transaction.Transaction.newBundle()
      results.each(\elt -> {
        var nRun = bundle.add(elt)
        nRun.ERRunStatus = ERRunStatus_ACC.TC_COMPLETED
      })
      bundle.commit()
    }
  }
}