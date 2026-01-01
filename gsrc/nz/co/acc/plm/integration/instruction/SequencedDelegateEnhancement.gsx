package nz.co.acc.plm.integration.instruction

/**
 * Provide methods to simplify the Sequencer logic
 */
enhancement SequencedDelegateEnhancement : SequencedDelegate_ACC {

  /**
   * If the current SequencedDelegate is not completed, WF should be able to
   * recover from failure
   */
  public function resumeWorkflowIfPossible() {
    if (this typeis InstructionWorker_ACC) {
      this.resumeWorkflowIfCan()
    }
  }

  /**
   * Can a workflow be created for this SequencedDelegate
   *
   * @return boolean
   */
  public function canCreateWorkflow() : boolean {
    if (this typeis InstructionWorker_ACC) {
      return this.InstructionExecStatus_ACC == InstructionExecStatus_ACC.TC_SEQUENCED
    } else {
      return false
    }
  }

  /**
   * Create workflow for the SequenceDelegate
   */
  public function createWorkflow() {
    if (this typeis InstructionWorker_ACC) {
      var wf = new InstructionWF_ACC(this.Bundle)
      wf.InstructionWorker_ACC = this
      wf.startAsynchronously()
      this.updateStatus(InstructionExecStatus_ACC.TC_PROCESSING)
    }
  }
}
