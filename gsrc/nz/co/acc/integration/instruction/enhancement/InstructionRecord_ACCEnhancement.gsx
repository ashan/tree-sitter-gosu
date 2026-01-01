package nz.co.acc.integration.instruction.enhancement

uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.integration.instruction.handler.InstructionRecordHandlerUtil
uses nz.co.acc.integration.instruction.ui.InstructionRecordsSearchHelper
uses gw.surepath.suite.integration.logging.StructuredLogger

/**
 * Created by Mike Ourednik on 7/02/2021.
 */
enhancement InstructionRecord_ACCEnhancement : InstructionRecord_ACC {

  public function isRetryable() : Boolean {
    return InstructionRecordHandlerUtil.isRetryableStatus(this.Status)
  }

  /**
   * JUNO-4025 This function is called from the UI(InstructionRecordSearch_ACC.pcf) Retry Selected records button
   */
  public function setStatusToRetry() {
    var log = StructuredLogger.CONFIG.withClass(InstructionRecord_ACCEnhancement)

    if(isRetryable()) {
      log.info("User '${User.util.CurrentUser}' retried ${this.DisplayName_ACC}")
      gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
        var instructionRecord = bundle.add(this)
        instructionRecord.Status = InstructionRecordStatus_ACC.TC_MANUALRETRY
      })
    }
  }

  /**
   * JUNO-4025 To find out if the record is completed already
   */
  public function hasCompletedState() : Boolean {
    return InstructionRecordsSearchHelper.isCompletedStatus(this.Status)
  }

  /**
   * JUNO-4025 To find out if the record is completed already
   */
  public function hasSkippedByValue() : Boolean {
    return InstructionRecordsSearchHelper.isSkippedStatus(this.Status)
  }

  /**
   * JUNO-4025 To find out if the record can be skipped
   */

  public function canSkip() : boolean {
    return not hasCompletedState()
  }

  public function isSkipped() : boolean {
    return not hasCompletedState()
  }

  /**
   * JUNO-4025 set the status of selected records from Error to Skipped
   */
  public function setStatusToSkipped() {
    var log = StructuredLogger.CONFIG.withClass(this)
    if (canSkip()) {
      var user = User.util.CurrentUser
      log.info("User '${User.util.CurrentUser}' skipped ${this.DisplayName_ACC}")
      gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
        var instructionRecord = bundle.add(this)
        instructionRecord.setStatus(InstructionRecordStatus_ACC.TC_SKIPPED)
        instructionRecord.SkippedBy = user
      })
    }
  }

  property get DisplayName_ACC(): String {
    return "InstructionRecord_ACC(${this.ID}, ${this.InstructionType_ACC}, ${this.ACCID}, ${this.Parameters})"
  }
}
