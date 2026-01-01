package nz.co.acc.plm.integration.ir.exec


uses nz.co.acc.integration.instruction.handler.impl.ManualRetryInstructionRecordHandler
uses nz.co.acc.integration.instruction.helper.InstructionRecordUtil
uses nz.co.acc.integration.instruction.record.impl.ManualRetryInstructionRecord
uses nz.co.acc.integration.ir.workqueue.IRInboundRecordProcessor
uses nz.co.acc.plm.integration.ir.util.BundleHelper
uses nz.co.acc.plm.integration.ir.util.ConstantPropertyHelper
uses gw.surepath.suite.integration.logging.StructuredLogger

/**
 * All the methods on "IRInboundRecord_ACC" related to Execution.
 */
enhancement IRInboundRecordEnhancement : IRInboundRecord_ACC {

  /**
   * The latest payload for this IRInboundRecord_ACC
   */
  public function deriveCurrentPayload() : String {
    var payloadList = this.IROverridePayload_ACCs
    if (payloadList?.HasElements) {
      return payloadList.orderBy(\p -> p.PayloadTimestamp).last().getPayloadAsAscii()
    } else {
      return this.getPayloadAsAscii()
    }
  }

  /**
   * The latest override payload for this IRInboundRecord_ACC.
   * If this inbound record only has original payload,
   * NULL will be returned.
   */
  public function deriveLatestPayloadHistory() : IROverridePayload_ACC {
    var payloadList = this.IROverridePayload_ACCs
    if (payloadList?.HasElements) {
      return payloadList.orderBy(\p -> p.PayloadTimestamp).last()
    }
    return null
  }

  /**
   * The latest override payload for this IRInboundRecord_ACC.
   * If this inbound record only has original payload,
   * NULL will be returned.
   */
  public property get PayloadOverridden() : boolean {
    return this.IROverridePayload_ACCs?.HasElements
  }

  /**
   * This is manual process, user try to override payload to fix the error.
   */
  public function overridePayloadInNewBundle(payload : String) {
    gw.transaction.Transaction.runWithNewBundle(\bundle -> {
      var overridePayload : IROverridePayload_ACC
      try {
        overridePayload = new IROverridePayload_ACC(bundle)
        overridePayload.setPayloadFromUnicode(payload)
        overridePayload.PayloadTimestamp = Date.CurrentDate
        var r = BundleHelper.explicitlyAddBeanToBundle(this, false)
        r.addToIROverridePayload_ACCs(overridePayload)

      } catch (e : Exception) {
        bundle.delete(overridePayload)
        throw e
      }
    })
  }

  /**
   * This method defines when override payload function is available.
   * returns boolean value
   */
  public function canOverridePayload() : boolean {
    var overridControl = ScriptParameters.IROverridePayloadControl_ACC
    if (overridControl == ConstantPropertyHelper.OVERRIDECONTROL_NONE) {
      return false
    } else if (overridControl == ConstantPropertyHelper.OVERRIDECONTROL_REGONLY && this.IRExtRecordType_ACC != IRExtRecordType_ACC.TC_CREG1) {
      return false
    } else {
      if (overridControl == ConstantPropertyHelper.OVERRIDECONTROL_ALL || overridControl == ConstantPropertyHelper.OVERRIDECONTROL_REGONLY) {
        //According to payload control, this override is allowed
        return canRecordBeOverriden()
      }
      return false
    }
  }

  /**
   * This logic is not considering override payload control script parameters
   */
  private function canRecordBeOverriden() : boolean {
    return InboundRecordUtil.isPayloadOverridableStatus(this.Status)
  }

  public function hasErrorState() : Boolean {
    return InboundRecordUtil.isErrorStatus(this.Status)
  }

  public function hasCompletedState() : Boolean {
    return InboundRecordUtil.isCompletedStatus(this.Status)
  }

  public function isRetryable() : Boolean {
    return InboundRecordUtil.isRetryableStatus(this.Status)
  }

  public function canSkip() : boolean {
    return not hasCompletedState()
  }

  public function setStatusToRetry() {
    var log = StructuredLogger.CONFIG.withClass(this)

    if (isRetryable()) {
      log.info("User '${User.util.CurrentUser}' retried ${this.DisplayName_ACC}")
      gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
        var inboundRecord = bundle.add(this)
        inboundRecord.Status = IRInboundRecordStatus_ACC.TC_RETRY
        inboundRecord.RuntimeMessage = null
        InstructionRecordUtil.createManualRetryInstructionRecordEntity(bundle, this.SequencerKey)
      })
    }
  }

  public function setStatusToSkipped() {
    var log = StructuredLogger.CONFIG.withClass(this)
    if (canSkip()) {
      var user = User.util.CurrentUser
      log.info("User '${User.util.CurrentUser}' skipped ${this.DisplayName_ACC}")
      gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
        var inboundRecord = bundle.add(this)
        inboundRecord.setStatus(IRInboundRecordStatus_ACC.TC_SKIPPEDBYUSER)
        inboundRecord.SkippedBy = user
      })
    }
  }

  property get DisplayName_ACC(): String {
    return "IRInboundRecord_ACC(${this.IRExtRecordType_ACC}, ${this.SequencerKey}, ${this.PublicID})"
  }

}
