package nz.co.acc.gwer.batch

uses gw.processes.BatchProcessBase
uses gw.api.database.Query
uses gw.api.database.QuerySelectColumns
uses gw.api.path.Paths
uses gw.api.database.Relop
uses nz.co.acc.gwer.ERRunParameter
uses nz.co.acc.gwer.util.ERProcessUtils_ACC
uses gw.surepath.suite.integration.logging.StructuredLogger_ACC

uses java.util.concurrent.atomic.AtomicInteger
uses java.util.concurrent.ConcurrentLinkedQueue
uses java.util.concurrent.CountDownLatch
uses java.util.concurrent.Executors

class ERProcessRunRequest_ACC extends BatchProcessBase {
  private static var _logger = StructuredLogger_ACC.CONFIG.withClass(ERProcessRunRequest_ACC)
  private var _erProcessUtils : ERProcessUtils_ACC
  private var _erRunTargetGroup : ArrayList<ERBusinessGroup_ACC>
  private var _erRunTargetMember : ArrayList<String>
  construct() {
    super(BatchProcessType.TC_ERPROCESSRUNREQUEST_ACC)
    this._erProcessUtils = new ERProcessUtils_ACC()
    this._erRunTargetGroup = new ArrayList<ERBusinessGroup_ACC>()
    this._erRunTargetMember = new ArrayList<String>()
  }
  
  protected override function doWork() {
    var erRun : ERRun_ACC
    //1.> Get Approved Requests
    var queryRequest = Query.make(ERRequest_ACC)
        .compare(ERRequest_ACC#ERRequestDecision, Relop.Equals, ERRequestDecision_ACC.TC_APR)
        .select()
    for (erRequest in queryRequest) {
      erRun = getERRun(erRequest)
      if(erRun == null){
        //2.> Create ER Run In-progress for each approved request
        erRun = createERRun(erRequest)
        generatePolicyGroups(erRun)
      }
    }
  }

  function getERRun(erReq : ERRequest_ACC) : ERRun_ACC {
    return Query.make(ERRun_ACC)
        .compare(ERRun_ACC#ERRequest, Relop.Equals, erReq)
        .select().AtMostOneRow
  }

  function createERRun(erReq : ERRequest_ACC) : ERRun_ACC {
    var oEntity : ERRun_ACC
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      oEntity = new ERRun_ACC()
      oEntity.ERRunStatus = ERRunStatus_ACC.TC_INPROGRESS
      oEntity.RunDateTime = Date.CurrentDate
      oEntity.ERRequest = erReq
      _logger.info("Created ER Run")
    })
    return oEntity
  }
  
  function setERRunStatus(erRun : ERRun_ACC, status : ERRunStatus_ACC) {
    gw.transaction.Transaction.runWithNewBundle(\bundle -> {
      bundle.add(erRun).ERRunStatus = status
    })
  }

  function generatePolicyGroups(erRun : ERRun_ACC) {
    var erReq = erRun.ERRequest
    var erRunParam = new ERRunParameter(erReq.LevyYear)
    var erRunTargetMember = new ArrayList<String>()
    var erRunTargetGroup = new ArrayList<ERBusinessGroup_ACC>()
    var listExpYears = _erProcessUtils.getTargetYears(erRunParam, Boolean.TRUE)
    var targetACCPolicyID : Set<String>
    var targetBusinessGroup : Set<ERBusinessGroup_ACC>
    var targetProduct = new ArrayList<String>()

    if (erReq.ERRequestType == ERRequestType_ACC.TC_REC) {
      //get list of ACCPolicyID and BusinessGroups from Request Target")
      getRunRequestTarget(erReq, erRunTargetGroup, erRunTargetMember)
    } else if (erReq.ERRequestType == ERRequestType_ACC.TC_ANN || erReq.ERRequestType == ERRequestType_ACC.TC_TRL ) {
      switch (erReq.ERRequestGroupType) {
//        case ERRequestGroupType_ACC.TC_SEL:
//          //get list of ACCPolicyID and BusinessGroups from Request Target")
//          getRunRequestTarget(erReq, erRunTargetGroup, erRunTargetMember)
//          break;
        case ERRequestGroupType_ACC.TC_SEP:
          //get list of ACCPolicyID with PolicyPeriod in LevyYear run with LE or LevyDue and product is CP/CPX
          targetProduct.add("IndividualACC")
          getRunActivePolicyByProduct(erRunTargetMember, targetProduct.asArrayOf(String), listExpYears)
          break;
        case ERRequestGroupType_ACC.TC_EMP:
          //get list of ACCPolicyID with PolicyPeriod in LevyYear run with LE or LevyDue and product is WPC/WPS
          targetProduct.add("EmployerACC")
          targetProduct.add("ShareholdingCompany")
          getRunActivePolicyByProduct(erRunTargetMember, targetProduct.asArrayOf(String), listExpYears)
          break;
        case ERRequestGroupType_ACC.TC_ALL:
          //get list of ACCPolicyID with PolicyPeriod in LevyYear run with LE or LevyDue (regardless of product)
          getRunActivePolicyByProduct(erRunTargetMember, null, listExpYears)
          break;
      }
    }
    createPolicyGroups(erRun, erRunParam, erRunTargetMember, erRunTargetGroup)
  }

  function getRunRequestTarget(erReq : ERRequest_ACC, erRunTargetGroup : ArrayList<ERBusinessGroup_ACC>, erRunTargetMember : ArrayList<String>) {
    var queryTarget = Query.make(ERRequestTargetEntity_ACC)
        .compare(ERRequestTargetEntity_ACC#ERRequest, Relop.Equals, erReq)
        .select()
    var targetACCPolicyID = queryTarget.where(\elt -> elt.ACCPolicyID_ACC.HasContent)*.ACCPolicyID_ACC.toSet()
    if (targetACCPolicyID.HasElements)
      erRunTargetMember.addAll(targetACCPolicyID)

    var targetBusinessGroup = queryTarget.where(\elt -> elt.ERBusinessGroup != null)*.ERBusinessGroup.toSet()
    if (targetBusinessGroup.HasElements)
      erRunTargetGroup.addAll(targetBusinessGroup)
  }


  function getRunActivePolicyByProduct(erRunTargetMember : ArrayList<String>, product : String[], targetYears : Integer[]) {
    // get list of ACCPolicyIDs with PolicyPeriod that are active (has LE/Levy)
    // on Run LevyYear and within the Exp Start Date & exp End Date
    var queryPolicyTerm = Query.make(PolicyTerm)
    queryPolicyTerm.compare(PolicyTerm#HasLEorLevies_ACC, Relop.Equals, Boolean.TRUE)
    queryPolicyTerm.compare(PolicyTerm#Cancelled_ACC, Relop.Equals, Boolean.FALSE)
    queryPolicyTerm.compareIn(PolicyTerm#LevyYear_ACC, targetYears)
    if (product == null) {
      var queryPolicy = queryPolicyTerm.join(PolicyTerm#Policy)
          .compareNotIn(Policy#ProductCode, new String[] {'AccreditedEmployersProgramme'})
    } else {
      var queryPolicy = queryPolicyTerm.join(PolicyTerm#Policy)
          .compareIn(Policy#ProductCode, product)
    }
    var result = queryPolicyTerm.select({
        QuerySelectColumns.path(Paths.make(PolicyTerm#ACCPolicyID_ACC))
    }).transformQueryRow(\row -> row.getColumn(0) as String).toSet()
    if (result.HasElements)
      erRunTargetMember.addAll(result)
  }

  function createPolicyGroups(erRun : ERRun_ACC, erRunParam : ERRunParameter, erRunTargetMember : ArrayList<String>, erRunTargetGroup : ArrayList<ERBusinessGroup_ACC>) {
    var listACCPolicyID = erRunTargetMember.asArrayOf(String)
    var businessGroupMembers : ERBusinessGroupMember_ACC[]
    if (listACCPolicyID.length < 2000) {
      businessGroupMembers = _erProcessUtils.getBusinessGroupMembers(erRunParam, null, listACCPolicyID)
    } else {
      var arrayBusinessGroupMembers = new ArrayList<ERBusinessGroupMember_ACC>()
      var batchListACCPolicyID : String[]
      var batchArray = new ArrayList<String>()
      for (accPolicyID in listACCPolicyID index i) {
        batchArray.add(accPolicyID)
        if ((i+1) % 2000 == 0) {
          batchListACCPolicyID = batchArray.asArrayOf(String)
          arrayBusinessGroupMembers.addAll(_erProcessUtils.getBusinessGroupMembers(erRunParam, null, batchListACCPolicyID).toSet())
          batchArray.clear()
        }
      }
      if (batchArray.size() > 0) {
        batchListACCPolicyID = batchArray.asArrayOf(String)
        arrayBusinessGroupMembers.addAll(_erProcessUtils.getBusinessGroupMembers(erRunParam, null, batchListACCPolicyID).toSet())
        batchArray.clear()
      }
      businessGroupMembers = arrayBusinessGroupMembers.asArrayOf(ERBusinessGroupMember_ACC)
    }
    var listWithBusinessGroup = businessGroupMembers*.ACCPolicyID_ACC
    var listWithoutBusinessGroup = listACCPolicyID.where(\elt -> listWithBusinessGroup.contains(elt) == false).toList()
//    for (accPolicyID in listWithoutBusinessGroup) {
//      _erProcessUtils.createERRunPolicyGroup(erRun, null as ERBusinessGroup_ACC, accPolicyID as String)
//    }
    executeThreadedCreation("AccPolicyID", erRun, listWithoutBusinessGroup, null)

    erRunTargetGroup.addAll(businessGroupMembers*.ERBusinessGroup.toSet())
    var listBusinessGroup = erRunTargetGroup
//    for (erBusinessGroup in listBusinessGroup) {
//      _erProcessUtils.createERRunPolicyGroup(erRun, erBusinessGroup as ERBusinessGroup_ACC, null as String)
//    }
    executeThreadedCreation("ERBusinessGroup", erRun, null, listBusinessGroup)
  }

  function executeThreadedCreation(dataType : String, erRun : ERRun_ACC, listWithoutBusinessGroup : List<String>, listBusinessGroup : List<ERBusinessGroup_ACC>) {
    var numThreads : Integer = 20
    var executor = Executors.newFixedThreadPool(numThreads)
    var threadStats = new ThreadStats(numThreads)

    var workQueueAccPolicyID : ConcurrentLinkedQueue<String>
    var workQueueGroup : ConcurrentLinkedQueue<ERBusinessGroup_ACC>
    if (dataType.equalsIgnoreCase("AccPolicyID")) {
      workQueueAccPolicyID = new ConcurrentLinkedQueue<String>()
      workQueueAccPolicyID.addAll(listWithoutBusinessGroup)
    } else if (dataType.equalsIgnoreCase("ERBusinessGroup")) {
      workQueueGroup = new ConcurrentLinkedQueue<ERBusinessGroup_ACC>()
      workQueueGroup.addAll(listBusinessGroup)
    }

    for (var i in 1..numThreads) {
      executor.submit(new Worker("Worker_${i}", dataType, erRun, workQueueAccPolicyID, workQueueGroup, threadStats))
    }
    threadStats.CountDownLatch.await()
    executor.shutdown()
  }

  public class Worker implements Runnable {
    final var _workerName : String
    final var _workDataType : String
    final var _erRun : ERRun_ACC
    final var _workQueueAccPolicyID : ConcurrentLinkedQueue<String>
    final var _workQueueGroup : ConcurrentLinkedQueue<ERBusinessGroup_ACC>
    final var _threadStats : ThreadStats

    construct(
        name : String,
        dataType : String,
        erRun : ERRun_ACC,
        workQueueAccPolicyID : ConcurrentLinkedQueue<String>,
        workQueueGroup : ConcurrentLinkedQueue<ERBusinessGroup_ACC>,
        threadStats : ThreadStats) {
      this._workerName = name
      this._workDataType = dataType
      this._erRun = erRun
      this._workQueueAccPolicyID = workQueueAccPolicyID
      this._workQueueGroup = workQueueGroup
      this._threadStats = threadStats
      logInfo("Initialized thread")
    }

    function run() {
      var processedCount = 0
      if (_workDataType.equalsIgnoreCase("AccPolicyID")) {
        var workItemAccPolicyID = _workQueueAccPolicyID.poll()
        while (workItemAccPolicyID != null) {
          logInfo("Processing work item")
          try {
            processWorkItemAccPolicyID(workItemAccPolicyID)
            _threadStats.ProcessedCounter.incrementAndGet()
          } catch (e : Exception) {
            logError("Failed to process work item", e)
            _threadStats.ErrorCounter.incrementAndGet()
          }
          workItemAccPolicyID = _workQueueAccPolicyID.poll()
          processedCount += 1
        }
      } else if (_workDataType.equalsIgnoreCase("ERBusinessGroup")) {
        var workItemGroup = _workQueueGroup.poll()
        while (workItemGroup != null) {
          logInfo("Processing work item")
          try {
            processWorkItemGroup(workItemGroup)
            _threadStats.ProcessedCounter.incrementAndGet()
          } catch (e : Exception) {
            logError("Failed to process work item", e)
            _threadStats.ErrorCounter.incrementAndGet()
          }
          workItemGroup = _workQueueGroup.poll()
          processedCount += 1
        }
      }

      logInfo("Worker finished. Processed ${processedCount} work items")
      _threadStats.CountDownLatch.countDown()
    }

    private function processWorkItemAccPolicyID(accPolicyID : String) {
      _erProcessUtils.createERRunPolicyGroup(_erRun, null as ERBusinessGroup_ACC, accPolicyID as String)
    }

    private function processWorkItemGroup(erBusinessGroup : ERBusinessGroup_ACC) {
      _erProcessUtils.createERRunPolicyGroup(_erRun, erBusinessGroup as ERBusinessGroup_ACC, null as String)
    }

    function logInfo(msg : String) {
      _logger.info("${_workerName}: ${msg}")
    }

    function logError(msg : String, e : Exception) {
      _logger.error("${_workerName}: ${msg}", null, e)
    }
  }

  class ThreadStats {
    final var _processedCounter : AtomicInteger as readonly ProcessedCounter
    final var _errorCounter : AtomicInteger as readonly ErrorCounter
    final var _countDownLatch : CountDownLatch as readonly CountDownLatch

    construct(numThreads : Integer) {
      _processedCounter = new AtomicInteger(0)
      _errorCounter = new AtomicInteger(0)
      _countDownLatch = new CountDownLatch(numThreads)
    }
  }
}