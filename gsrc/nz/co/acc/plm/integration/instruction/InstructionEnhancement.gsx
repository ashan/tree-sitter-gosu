package nz.co.acc.plm.integration.instruction

uses gw.api.admin.WorkflowUtil
uses gw.api.database.Query
uses gw.api.util.DateUtil
uses nz.co.acc.plm.integration.ir.util.BundleHelper

/**
 * The functions create to simply the UI and logic for
 * Instruction_ACC
 */
enhancement InstructionEnhancement : Instruction_ACC {

  /**
   * Initiliation for a new record.
   */
  public function doInitOfNewRecord() {
    var builder = this.InstructionType_ACC.createWorkerBuilder()
    this.WorkerBuilder = builder
    builder.loadParameters()
    this.buildWorker()
  }

  /**
   * Is all the record compleled?
   */
  public function deriveAllWorksCompleted() : boolean {
    return !this.InstructionWorker_ACCs.hasMatch(\w -> !w.Completed)
  }

  /**
   * Reload the stats
   */
  public function reloadStats() {
    var timestampStarted = DateUtil.currentDate()

    var q = Query.make(InstructionWorker_ACC)
    q.compare(InstructionWorker_ACC#Instruction_ACC, Equals, this)
    var theCount = q.select().getCount()
    this.TotalWorkerCount = theCount

    q = Query.make(InstructionWorker_ACC)
    q.compare(InstructionWorker_ACC#Instruction_ACC, Equals, this)
    q.compare(InstructionWorker_ACC#Completed, NotEquals, true)
    theCount = q.select().getCount()
    this.CompletedWorkerCount = this.TotalWorkerCount - theCount

    //clean up
    var unfinishedWorkers = findUnprocessedInstructionWorkers()
    while (unfinishedWorkers.HasElements) {
      var worker = unfinishedWorkers.poll()
      var wf = worker.InstructionWF
      if (wf == null) {
        var seq = IRSequencer_ACC.findSequencerOrCreateNew(worker.SequencerKey, this.Bundle)
        seq.resetSequencerPointerToExecNextRecord()
      } else if ((wf.State == WorkflowState.TC_ERROR || wf.State == WorkflowState.TC_SUSPENDED)) {
        WorkflowUtil.resumeWorkflow(wf)
      }
    }
    this.StatsTimestamp = DateUtil.currentDate()
    this.StatsSecToRun = DateUtil.secondsSince(timestampStarted) + 1
  }

  private function findUnprocessedInstructionWorkers() : LinkedList<InstructionWorker_ACC> {
    var q = Query.make(InstructionWorker_ACC)
    q.compare(InstructionWorker_ACC#Instruction_ACC, Equals, this)
    q.compare(InstructionWorker_ACC#InstructionExecStatus_ACC, NotEquals, InstructionExecStatus_ACC.TC_PROCESSED)
    var instructionWorkers = q.select()
    var instructionWorkerQueue = new LinkedList<InstructionWorker_ACC>()
    instructionWorkers.each(\instructionWorker -> instructionWorkerQueue.add(instructionWorker))
    return instructionWorkerQueue
  }

  /**
   * Skip All error transactions
   */
  public function skipAll() {
    var q = Query.make(InstructionWorker_ACC)
    q.compare(InstructionWorker_ACC#Instruction_ACC, Equals, this)
    q.compare(InstructionWorker_ACC#InstructionExecStatus_ACC, Equals, InstructionExecStatus_ACC.TC_PROCESSING)

    var list = q.select()

    list.each(\worker -> {
      if (worker.canBeSkipped()) {
        gw.transaction.Transaction.runWithNewBundle(\b -> {
          var edit = BundleHelper.explicitlyAddBeanToBundle(b, worker, false)
          edit.updateStatus(InstructionExecStatus_ACC.TC_SKIPPED)
        })
      }
    })
  }

  /**
   * Get workflow related to this Instruction
   */
  public property get InstructionWF() : InstructionWF_ACC {
    var q = Query.make(InstructionWF_ACC)
    q.compare(InstructionWF_ACC#Instruction_ACC, Equals, this)
    var list = q.select()
    if (list.HasElements && list.Count == 1) {
      return list.AtMostOneRow
    }
    return null
  }

  /**
   * Get inbound record related to this Instruction
   */
  public property get IRInboundRecord() : IRInboundRecord_ACC {
    if (this.IRInboundRecordPID == null) {
      return null
    }
    var q = Query.make(IRInboundRecord_ACC)
    q.compare(IRInboundRecord_ACC#PublicID, Equals, this.IRInboundRecordPID)
    var list = q.select()
    if (list.HasElements && list.Count == 1) {
      return list.AtMostOneRow
    }
    return null
  }

}
