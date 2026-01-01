package nz.co.acc.gwer.batch

uses gw.processes.WorkQueueBase
uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.surepath.suite.integration.logging.StructuredLogger_ACC
uses nz.co.acc.gwer.ERRunParameter
uses nz.co.acc.gwer.util.ERProcessUtils_ACC

class ERGenerateLevyPayers_ACC extends WorkQueueBase<ERRunPolicyGroup_ACC, StandardWorkItem> {
  private static var _logger = StructuredLogger_ACC.CONFIG.withClass(ERGenerateLevyPayers_ACC)
  private var _erProcessUtils : ERProcessUtils_ACC
  construct () {
    super(BatchProcessType.TC_ERGENERATELEVYPAYERS_ACC, StandardWorkItem, ERRunPolicyGroup_ACC)
    this._erProcessUtils = new ERProcessUtils_ACC()
  }

  override function findTargets(): Iterator<ERRunPolicyGroup_ACC> {
    var queryPolicyGroup = Query.make(ERRunPolicyGroup_ACC)
    queryPolicyGroup.join(ERRunPolicyGroup_ACC#ERRun)
        .compare(ERRun_ACC#ERRunStatus, Relop.Equals, ERRunStatus_ACC.TC_INPROGRESS)
    return queryPolicyGroup.select().iterator()
  }

  override function processWorkItem(item : StandardWorkItem) {
    var policyGroup = extractTarget(item)
    var erRunParam = new ERRunParameter(policyGroup.ERRun.ERRequest.LevyYear)
    var erRun = policyGroup.ERRun
    var erRunTargetMember = new ArrayList<String>()
    var erRunTargetGroup = new ArrayList<ERBusinessGroup_ACC>()
    if (policyGroup.ERBusinessGroup != null) {
      erRunTargetGroup.add(policyGroup.ERBusinessGroup)

    } else if (policyGroup.ACCPolicyID_ACC != null) {
      erRunTargetMember.add(policyGroup.ACCPolicyID_ACC)
      createLevyPayerPerACCPolicyID(erRun, erRunParam, erRunTargetMember, erRunTargetGroup)

    }
    createLevyPayerPerBusinessGroup(erRun, erRunParam, erRunTargetMember, erRunTargetGroup)
    createLevyPayerPerTransferCounterparty(erRun, erRunParam, erRunTargetMember)
  }

  function createLevyPayerPerACCPolicyID(erRun : ERRun_ACC, erRunParam : ERRunParameter, erRunTargetMember : ArrayList<String>, erRunTargetGroup : ArrayList<ERBusinessGroup_ACC>) {
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
    var listWithoutBusinessGroup = listACCPolicyID.where(\elt -> listWithBusinessGroup.contains(elt) == false)
    for (accPolicyID in listWithoutBusinessGroup) {
      _erProcessUtils.createERRunLevyPayer(erRun, null as ERBusinessGroup_ACC, accPolicyID as String, false)
    }
    var result = businessGroupMembers*.ERBusinessGroup.toSet()
    if (result.HasElements)
      erRunTargetGroup.addAll(result)
  }

  function createLevyPayerPerBusinessGroup(erRun : ERRun_ACC, erRunParam : ERRunParameter, erRunTargetMember : ArrayList<String>, erRunTargetGroup : ArrayList<ERBusinessGroup_ACC>) {
    var listERBusinessGroup = erRunTargetGroup.where(\elt -> elt != null).asArrayOf(ERBusinessGroup_ACC)
    var businessGroupMembers = _erProcessUtils.getBusinessGroupMembers(erRunParam, listERBusinessGroup,  null)
    for (member in businessGroupMembers) {
      _erProcessUtils.createERRunLevyPayer(erRun, member.ERBusinessGroup as ERBusinessGroup_ACC, member.ACCPolicyID_ACC, false)
      erRunTargetMember.add(member.ACCPolicyID_ACC as String)
    }
  }

  function createLevyPayerPerTransferCounterparty(erRun : ERRun_ACC, erRunParam : ERRunParameter, erRunTargetMember : ArrayList<String>) {
    var listACCPolicyID = erRunTargetMember.toTypedArray()
    var listTransferCounterparty : String[]
    if (listACCPolicyID.length < 1000) {
      listTransferCounterparty = _erProcessUtils.getERTransferCounterparty(erRun, listACCPolicyID, Boolean.FALSE)

    } else {
      var arrayTransferCounterparty = new ArrayList<String>()
      var batchListACCPolicyID : String[]
      var batchArray = new ArrayList<String>()
      for (accPolicyID in listACCPolicyID index i) {
        batchArray.add(accPolicyID)
        if ((i+1) % 1000 == 0) {
          batchListACCPolicyID = batchArray.asArrayOf(String)
          arrayTransferCounterparty.addAll(_erProcessUtils.getERTransferCounterparty(erRun, batchListACCPolicyID, Boolean.FALSE).toSet())
          batchArray.clear()
        }
      }
      if (batchArray.size() > 0) {
        batchListACCPolicyID = batchArray.asArrayOf(String)
        arrayTransferCounterparty.addAll(_erProcessUtils.getERTransferCounterparty(erRun, batchListACCPolicyID, Boolean.FALSE).toSet())
        batchArray.clear()
      }
      listTransferCounterparty = arrayTransferCounterparty.asArrayOf(String)
    }

    for (counterparty in listTransferCounterparty) {
      _erProcessUtils.createERRunLevyPayer(erRun, null as ERBusinessGroup_ACC, counterparty as String, true)
    }
  }
}