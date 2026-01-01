package nz.co.acc.plm.integration.instruction.handler

uses gw.api.util.DisplayableException
uses gw.pl.persistence.core.Bundle
uses nz.co.acc.lob.util.LiableEarningsUtilities_ACC
uses nz.co.acc.plm.integration.instruction.util.InstructionConstantHelper
uses entity.PolicyLine
uses entity.BusinessIndustryCode_ACC
uses nz.co.acc.plm.integration.ir.util.ConstantPropertyHelper

/**
 * WorkHandler for BulkEarningsChange
 */
class BulkWPSEarningsChangeWorkHandler extends WorkHandlerBase {

  private var _levyYear : Integer

  /**
   * Load the Parameters.
   *
   * The expected value is "[LevyYear]"
   */
  override public function loadParameters() {
    var values : String[]
    var instructionParam = this.InstructionWorker.Parameters

    if (instructionParam != null) {
      values = instructionParam.split(InstructionConstantHelper.CSV_DELIMITER)
    }

    if (values == null || values.length != 1) {
      throw new DisplayableException("Parameters[${InstructionWorker.Parameters}] is not valid!")
    }
    _levyYear = Integer.valueOf(values[0])
  }

  /**
   * Do policy change here
   * @param bundle
   */
  override public function doWork(bundle : Bundle) {
    var key = InstructionWorker.SequencerKey

    var targets = findPolicyPeriodTargets(key, ConstantPropertyHelper.PRODUCTCODE_WPS, _levyYear)

    if (targets == null || targets.length == 0) {
      throw new DisplayableException("Can not find any targets to update!")
    }

    targets.each(\policyPeriod -> {
      if(policyPeriod.Audit == null) {
        if (LiableEarningsUtilities_ACC.isLiableEarningsNotAllZero(policyPeriod) == false) {
          InstructionWorker.RuntimeMessage = "There are no Liable Earnings to update!"
        } else {
          var policy = policyPeriod.Policy
          policy.cleanUpInternalJobs_ACC(bundle, getReasonCode(), _levyYear)
          policy.withdrawDraftAudits(bundle, _levyYear)
          changeEarningsByPolicyChange(policyPeriod, bundle)
        }
      } else {
        throw new DisplayableException("Final Audit exists!")
      }
    })
  }

  /**
   * Change Earnings to ZERO by PolicyChange
   * @param bic
   * @param lastPeriod
   * @param bundle
   */
  private function changeEarningsByPolicyChange(lastPeriod : PolicyPeriod, bundle : Bundle) {
    var policyChange = new PolicyChange(bundle)

    setJobFlags(policyChange)
    policyChange.startJob(lastPeriod.Policy, lastPeriod.PeriodStart)

    var newPeriod = policyChange.LatestPeriod
    var theProcess = newPeriod.PolicyChangeProcess

    LiableEarningsUtilities_ACC.clearPolicyLiableEarnings(newPeriod)
    completePolicyChange(theProcess, newPeriod)
  }
}