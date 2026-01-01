package nz.co.acc.plm.workflow

uses gw.api.database.Relop
uses gw.pl.persistence.core.Bundle
uses gw.api.locale.DisplayKey
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.plm.integration.files.outbound.RecordCaptureActionFactory

uses gw.surepath.suite.integration.logging.StructuredLogger

/**
 * Enhancement for CPX Letters submission workflow
 */
enhancement CPXNewSubmissionLetterEnhancement: CPXNewSubmissionLetter_ACC {

  /**
   * For offerLetterFirst Issued
   */

  public function offerLetterFirst() {

    if (isContextValid()) {
      var policyPeriod = this.PolicyPeriod
      gw.transaction.Transaction.runWithNewBundle(\bundle -> {
        var captureAction = RecordCaptureActionFactory.getRecordCaptureAction(OutBoundRecordType_ACC.TC_CPX_OFFER, bundle)
        captureAction.captureFull(policyPeriod)
      })
      // JUNO-643 - Do not create log or history event for transactions in a draft status
      if (policyPeriod.Status != PolicyPeriodStatus.TC_DRAFT) {
        StructuredLogger.INTEGRATION.debug(this.getClass().getName() + " " + "offerLetterFirst" + " " + "Outbound record created for first CPX Offer letter ")
        policyPeriod.createCustomHistoryEvent(CustomHistoryType.TC_CPXLETTERS_ACC, \-> DisplayKey.get("Web.Admin.CPXLetters.WorkFlow.OfferLetterFirst"))
      }
    }else{
      this.invokeTrigger(WorkflowTriggerKey.TC_STOPCPXLETTERS_ACC)
    }

  }

  /**
   * For FirstLapseLetter Issued
   */
  public function offerLapseFirst() {

    if (isContextValid()) {
      var policyPeriod = this.PolicyPeriod
      gw.transaction.Transaction.runWithNewBundle(\bundle -> {
        var captureAction = RecordCaptureActionFactory.getRecordCaptureAction(OutBoundRecordType_ACC.TC_CPX_LAPSED_OFFER, bundle)
        captureAction.captureFull(policyPeriod)
      })
      // JUNO-643 - Do not create log or history event for transactions in a draft status
      if (policyPeriod.Status != PolicyPeriodStatus.TC_DRAFT) {
        StructuredLogger.INTEGRATION.debug( this.getClass().getName() + " " +  "offerLapseFirst" + " " + "Outbound record created for first CPX Lapsed Offer letter ")
        policyPeriod.createCustomHistoryEvent(CustomHistoryType.TC_CPXLETTERS_ACC, \-> DisplayKey.get("Web.Admin.CPXLetters.WorkFlow.FirstLapseLetter"))
      }
    }else{
      this.invokeTrigger(WorkflowTriggerKey.TC_STOPCPXLETTERS_ACC)
    }
  }

  /**
   * For OfferLetterSecond Issued
   */
  public function offerLetterSecond() {

    if (isContextValid()) {
      var policyPeriod = this.PolicyPeriod
      gw.transaction.Transaction.runWithNewBundle(\bundle -> {
        var captureAction = RecordCaptureActionFactory.getRecordCaptureAction(OutBoundRecordType_ACC.TC_CPX_OFFER, bundle)
        captureAction.captureFull(policyPeriod)
      })
      // JUNO-643 - Do not create log or history event for transactions in a draft status
      if (policyPeriod.Status != PolicyPeriodStatus.TC_DRAFT) {
        StructuredLogger.INTEGRATION.debug( this.getClass().getName() + " " + "offerLetterSecond" + " " + "Outbound record created for second CPX Offer letter ")
        policyPeriod.createCustomHistoryEvent(CustomHistoryType.TC_CPXLETTERS_ACC, \-> DisplayKey.get("Web.Admin.CPXLetters.WorkFlow.OfferLetterSecond"))
      }
    }else{
      this.invokeTrigger(WorkflowTriggerKey.TC_STOPCPXLETTERS_ACC)
    }
  }

  /**
   * For FinalLapseLetter Issued
   */
  public function offerLapseSecond() {

    if (isContextValid()) {
      var policyPeriod = this.PolicyPeriod
      gw.transaction.Transaction.runWithNewBundle(\bundle -> {
        var captureAction = RecordCaptureActionFactory.getRecordCaptureAction(OutBoundRecordType_ACC.TC_CPX_LAPSED_OFFER, bundle)
        captureAction.captureFull(policyPeriod)
      })
      // JUNO-643 - Do not create log or history event for transactions in a draft status
      if (policyPeriod.Status != PolicyPeriodStatus.TC_DRAFT) {
        StructuredLogger.INTEGRATION.debug( this.getClass().getName() + " " + "offerLapseSecond" + " " +  "Outbound record created for second CPX Lapsed Offer letter ")
        policyPeriod.createCustomHistoryEvent(CustomHistoryType.TC_CPXLETTERS_ACC, \-> DisplayKey.get("Web.Admin.CPXLetters.WorkFlow.FinalLapseLetter"))
      }
    }else{
      this.invokeTrigger(WorkflowTriggerKey.TC_STOPCPXLETTERS_ACC)
    }
  }

  /**
   * For withdrawTransaction
   */
  public function withdrawTransaction() {
    if (isContextValid()) {
      this.PolicyPeriod.Job.withdraw()
    }
  }

  /**
   * Find Account PolicyPeriod status
   */
  private function isContextValid(): boolean {
    if (! this.PolicyPeriod.INDCPXLineExists) {
      return false
    }

    var status = this.PolicyPeriod.getStatus()
    if (status == PolicyPeriodStatus.TC_BOUND or status == PolicyPeriodStatus.TC_NOTTAKEN or status == PolicyPeriodStatus.TC_WITHDRAWN) {
      return false
    } else {
      // DE323 - Do not process deceased accounts
      var accountStatus = this.PolicyPeriod.Policy?.Account?.StatusOfAccount_ACC
      if (accountStatus != null and accountStatus == StatusOfAccount_ACC.TC_DECEASED) {
        return false
      } else {
        return true
      }
    }
  }

  /**
   * Create the workflow through activity
   */
  public static function createWorkflow(policyPeriod: PolicyPeriod, bundle: Bundle) {
    stopCPXNewSubmissionLetterWorkflow(policyPeriod, bundle)
    if (policyPeriod.INDCPXLineExists && policyPeriod.Status == PolicyPeriodStatus.TC_QUOTED) {
       var wf = new CPXNewSubmissionLetter_ACC(bundle)
       wf.PolicyPeriod = policyPeriod
       wf.startAsynchronously()
    }
  }

  /**
   * Stop all uncompleted CPXNewSubmissionLetter_ACC workflow of the policy period
   */
  public static function stopCPXNewSubmissionLetterWorkflow(policyPeriod: PolicyPeriod, bundle: Bundle) {
    var query = gw.api.database.Query.make(CPXNewSubmissionLetter_ACC)
    query.compare(CPXNewSubmissionLetter_ACC#PolicyPeriod, Equals, policyPeriod)
    query.compare(CPXNewSubmissionLetter_ACC#State, NotEquals, WorkflowState.TC_COMPLETED)
    var wfList = query.select()
    wfList.each(\wf -> {
      if (wf.isTriggerAvailable(WorkflowTriggerKey.TC_STOPCPXLETTERS_ACC)) {
        var editWF = bundle.add(wf)
        editWF.invokeTrigger(WorkflowTriggerKey.TC_STOPCPXLETTERS_ACC)
      }
    })
  }

  /**
   * Create the workflow through activity
   */
  public function exitWorkflow() {
    var query = gw.api.database.Query.make(OutBoundRecord_ACC)
    query.compare(OutBoundRecord_ACC#OriginEntityID, Equals, this.PolicyPeriod.ID.getValue())
    query.compareIn(OutBoundRecord_ACC#Type, {OutBoundRecordType_ACC.TC_CPX_LAPSED_OFFER, OutBoundRecordType_ACC.TC_CPX_LAPSED_OFFER})
    query.compare(OutBoundRecord_ACC#Status, Equals, OutBoundRecordStatus_ACC.TC_NEW)
    var rList = query.select()
      rList.each(\r -> {
        var editR = this.Bundle.add(r)
        editR.Status = OutBoundRecordStatus_ACC.TC_CANCELLED
      })

  }

}
