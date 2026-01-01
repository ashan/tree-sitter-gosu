package nz.co.acc.plm.integration.instruction.handler

uses gw.api.util.DisplayableException
uses gw.pl.persistence.core.Bundle
uses nz.co.acc.plm.integration.instruction.util.InstructionConstantHelper

/**
 * WorkHandler for BulkFMUChange
 */
class BulkFMUChangeWorkHandler extends WorkHandlerBase {

  private var _levyYear : Integer
  private var _fmuValue : Boolean
  private var _productCode : String

  /**
   * Load the Parameters.
   *
   * The expected value is "[LevyYear],[FMUValue]"
   */
  override public function loadParameters() {
    var values : String[]
    var workerParam = this.InstructionWorker.Parameters

    if (workerParam != null) {
      values = workerParam.split(InstructionConstantHelper.CSV_DELIMITER)
    }

    if (values == null || values.length != 3) {
      throw new DisplayableException("Parameters[${InstructionWorker.Parameters}] is not valid!")
    }
    _productCode = values[0]
    _levyYear = Integer.valueOf(values[1])
    _fmuValue = Boolean.valueOf(values[2])
  }

  /**
   * Extract INDCoPCov from PolicyPeriod
   * @param pp PolicyPeriod
   * @return INDCoPCov
   */
  private function extractINDCoPCov(pp : PolicyPeriod) : INDCoPCov {
    var line = pp.INDCoPLine

    if (line == null) {
      throw new DisplayableException("This policy doesn't have correct line!")
    }

    var covs = line.INDCoPCovs

    if (covs.Count != 1) {
      throw new DisplayableException("Policy has multiple Coverages!")
    }

    var cov = covs[0]
    return cov
  }


  /**
   * Do policy change here
   * @param bundle
   */
  override public function doWork(bundle : Bundle) {
    var key = InstructionWorker.SequencerKey

    var targets = findPolicyPeriodTargets(key, _productCode, _levyYear)

    if (targets == null || targets.length == 0) {
      throw new DisplayableException("Can not find any targets to update!")
    }

    targets.each(\policyPeriod -> {

      if (! policyPeriod.INDCoPLineExists) {
         throw new DisplayableException("Only Individual policy has FMU!")
      }

      var policy = policyPeriod.Policy
      policy.cleanUpInternalJobs_ACC(bundle, getReasonCode(), _levyYear)

      var cov = extractINDCoPCov(policyPeriod)
       
      if (cov.CurrentLiableEarnings.FullTime == _fmuValue) {
        InstructionWorker.RuntimeMessage = "There is no Change for FMU"
      } else {
        var policyChange = new PolicyChange(bundle)
        setJobFlags(policyChange)

        policyChange.startJob(policy, policyPeriod.PeriodStart)

        var newPeriod = policyChange.LatestPeriod
        var theProcess = newPeriod.PolicyChangeProcess

        cov = extractINDCoPCov(newPeriod)
        cov.CurrentLiableEarnings.FullTime = _fmuValue

        completePolicyChange(theProcess, newPeriod)
      }
    })
  }

}