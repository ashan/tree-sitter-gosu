package nz.co.acc.plm.integration.instruction

uses gw.job.uw.UWAuthorityBlocksProgressException
uses nz.co.acc.plm.integration.instruction.handler.error.BlockedByUnprocessedIRRecordsException
uses nz.co.acc.plm.integration.ir.util.BundleHelper
uses gw.api.util.DisplayableException

/**
 * Workflow related functions.
 * InstructionWF_ACC can have either builder or worker.
 * InstructionWF_ACC can not have both builder and worker.
 */
enhancement InstructionWFEnhancement : InstructionWF_ACC {

  /**
   * This method will be invoked by workflow...
   */
  public function doAction() {
    try {
      gw.transaction.Transaction.runWithNewBundle(\b -> {
        var instruction = this.Instruction_ACC
        var executor = this.InstructionWorker_ACC
        if (instruction != null) {
          var edit = BundleHelper.explicitlyAddBeanToBundle(b, instruction, true)
          var builder = edit.WorkerBuilder
          if (!instruction.Skipped) {
            edit.RuntimeMessage = null
            builder.loadParameters()
            builder.buildWorker(b)
          }
        } else if (executor != null) {
          var edit = BundleHelper.explicitlyAddBeanToBundle(b, executor, true)
          var handler = edit.WorkHandler
          if (handler.isValidContext()) {
            edit.RuntimeMessage = null
            handler.loadParameters()
            handler.doWork(b)
            edit.updateStatus(InstructionExecStatus_ACC.TC_PROCESSED)
          }
        }
      }, "sys")
    } catch (e : Exception) {
      handleException(e)
      if (!isAutoHandledException(e)) {
        throw e
      }
    }
  }

  /**
   * Handle workflow Exceptions. Error message is saved for Worker
   *
   * @param e
   */
  private function handleException(e : Exception) {
    if (this.InstructionWorker_ACC != null) {
      var needToSuspendSequencer = needSequencerSuspension(e)

      gw.transaction.Transaction.runWithNewBundle(\b -> {
        var edit = BundleHelper.explicitlyAddBeanToBundle(b, this.InstructionWorker_ACC, true)
        edit.RuntimeMessage = deriveErrorMsg(e)

        if (needSkipRecord(e)) {
          edit.updateStatus(InstructionExecStatus_ACC.TC_SKIPPED)

        } else if (e typeis BlockedByUnprocessedIRRecordsException) {
          edit.updateStatus(InstructionExecStatus_ACC.TC_BLOCKED)

        } else {
          edit.updateStatus(InstructionExecStatus_ACC.TC_ERROR)
        }

        if (needToSuspendSequencer) {
          var seq = this.InstructionWorker_ACC.IRSequencer_ACC
          if (seq.IsActive) {
            var seqE = BundleHelper.explicitlyAddBeanToBundle(b, seq, false)
            seqE.IsActive = false
          }
        }
      })
    }

    if (this.Instruction_ACC != null) {
      gw.transaction.Transaction.runWithNewBundle(\b -> {
        var edit = BundleHelper.explicitlyAddBeanToBundle(b, this.Instruction_ACC, true)
        edit.RuntimeMessage = deriveErrorMsg(e)
      })
    }
  }

  /**
   * If true, for this type of exception we need to suspend sequencer.
   */
  private function needSequencerSuspension(e : Exception) : boolean {
    if (e typeis UWAuthorityBlocksProgressException) {
      return true
    } else {
      return false
    }
  }

  /**
   * If true, the current record will be marked as "Skipped".
   */
  private function needSkipRecord(e : Exception) : boolean {
    if (e typeis AutoSkippedError || e typeis UWAuthorityBlocksProgressException) {
      return true
    } else {
      return false
    }
  }

  /**
   * If False, the exception needs to be throw out
   */
  private function isAutoHandledException(e : Exception) : boolean {
    if (e typeis AutoSkippedError || e typeis UWAuthorityBlocksProgressException) {
      return true
    } else {
      return false
    }
  }

  /**
   * Extract error message for saving
   *
   * @param e
   * @return The error message to save
   */
  private function deriveErrorMsg(e : Exception) : String {
    var msg : String
    if (e typeis DisplayableException) {
      msg = e.Message
    } else if (e typeis UWAuthorityBlocksProgressException) {
      msg = e.toString()
    } else {
      msg = e.Message + "--" + e.StackTraceAsString
    }
    var errorMsg : String
    if (msg.length > 1000) {
      errorMsg = msg.substring(0, 1000)
    } else {
      errorMsg = msg
    }
    return errorMsg
  }
}
