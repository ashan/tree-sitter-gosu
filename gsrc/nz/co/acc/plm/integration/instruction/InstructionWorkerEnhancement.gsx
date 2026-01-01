package nz.co.acc.plm.integration.instruction

uses gw.api.admin.WorkflowUtil
uses gw.api.database.Query
uses gw.surepath.suite.integration.logging.StructuredLogger

uses gw.surepath.suite.integration.logging.StructuredLogger

/**
 * The functions create to simply logic for
 *    InstructionWorker_ACC
 */
enhancement InstructionWorkerEnhancement: InstructionWorker_ACC {

  /**
   * Initialization for a new record.
   */
  public function doInitOfNewRecord() {
    var seq = IRSequencer_ACC.findSequencerOrCreateNew(this.SequencerKey, this.Bundle)
    seq.addToInstructionWorker_ACCs(this)
    updateStatus(InstructionExecStatus_ACC.TC_PROCESSED.TC_SEQUENCED)
    seq.resetSequencerPointerToExecNextRecord()
  }

  /**
   * The InstructionExecStatus_ACC should be updated only via this method.
   */
  public function updateStatus(status : InstructionExecStatus_ACC) {
    this.InstructionExecStatus_ACC = status
    if (status == InstructionExecStatus_ACC.TC_PROCESSED || status == InstructionExecStatus_ACC.TC_SKIPPED) {
      this.RuntimeMessage = null
      this.Completed = true
      this.IRSequencer_ACC.resetSequencerPointerToExecNextRecord()
    }
  }

  /**
   * Resume workflow if it can be resumed. leverage OOB workflow API.
   */
  public function resumeWorkflowIfCan() {
    var fn = "resumeWorkflowIfCan"
    var wf = this.InstructionWF
    if ((wf != null) && (wf.State == WorkflowState.TC_ERROR || wf.State == WorkflowState.TC_SUSPENDED)) {
      StructuredLogger.INTEGRATION.debug( this + " " + fn + " " + "WF can be resumed!")
      WorkflowUtil.resumeWorkflow(wf)
    }
  }

  /**
   * Get workflow related to this Worker
   */
  public property get InstructionWF() : InstructionWF_ACC {
    var q = Query.make(InstructionWF_ACC)
    q.compare(InstructionWF_ACC#InstructionWorker_ACC, Equals, this)
    var list = q.select()
    if (list.HasElements && list.Count == 1) {
      return list.AtMostOneRow
    }
    return null
  }

  /**
   * To decide if this worker can be skipped
   */
  public function canBeSkipped() : boolean {
    var result = false
    if (this.InstructionExecStatus_ACC != InstructionExecStatus_ACC.TC_PROCESSING) {
      //We do this for performance reason. We only check Workflow entity if the status is processing
      return result
    }
    var wf = this.InstructionWF
    if (wf == null || (wf != null && wf.State == WorkflowState.TC_ERROR)) {
      result = true
    }
    return result
  }
}
