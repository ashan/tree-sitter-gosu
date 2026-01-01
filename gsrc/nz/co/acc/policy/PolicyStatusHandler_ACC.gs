package nz.co.acc.policy

uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.account.AccountStatusEvaluator
uses nz.co.acc.edge.capabilities.policy.util.PolicyUtil_ACC
uses nz.co.acc.lob.common.DateUtil_ACC
uses nz.co.acc.lob.util.LiableEarningsUtilities_ACC


/**
 * Created by Franklin.Manubag on 28/05/2021.
 */
class PolicyStatusHandler_ACC {
  final static var LOG = StructuredLogger.CONFIG.withClass(PolicyStatusHandler_ACC)
  var _policy : Policy
  var _policyPeriod : PolicyPeriod

  construct(policy : Policy, policyPeriod : PolicyPeriod) {
    _policy = policy
    _policyPeriod = policyPeriod
  }

  public static function executePreupdate(branch : PolicyPeriod) {
    if (not branch.isBoundOrAudited_ACC) {
      return
    }
    var currentLevyYear = DateUtil_ACC.getCurrentLevyYear()
    var requestAccountStatusUpdate = false

    if (branch.isNewSubmission() and not branch.IsAEPMasterPolicy_ACC) {
      branch.Policy.Status_ACC = PolicyStatus_ACC.TC_ACTIVE
      branch.Policy.ActiveReason_ACC = ActiveReason_ACC.TC_NEWCUSTOMER
      requestAccountStatusUpdate = true
    }

    if ((branch.LevyYear_ACC == currentLevyYear)
        or (isHistoricalYearForPolicyStatusUpdate(branch.LevyYear_ACC)
        and findMostRecentPeriodByLevyYear(branch, currentLevyYear) != null)) {

      var policy = branch.Policy
      new PolicyStatusHandler_ACC(policy, branch).evaluatePolicyStatus()
      requestAccountStatusUpdate = true
    }

    if (branch.Policy.IsActiveNewCustomer_ACC and branch.CeasedTrading_ACC) {
      branch.Policy.Status_ACC = PolicyStatus_ACC.TC_INACTIVE
      branch.Policy.ActiveReason_ACC = null
      requestAccountStatusUpdate = true
    }

    if (requestAccountStatusUpdate) {
      AccountStatusEvaluator.evaluateNewAccountStatusFromPreupdate(branch.Policy)
    }
  }

  private static function isHistoricalYearForPolicyStatusUpdate(branchLevyYear : Integer) : boolean {
    var endYear = getEarningsCutoffLevyYear()
    var startYear = endYear - 2
    return branchLevyYear >= startYear and branchLevyYear <= endYear
  }

  public static function getEarningsCutoffLevyYear() : int {
    var cutoffMonth = ScriptParameters.EarningsCutoffMonth_ACC
    var currentMonth = Date.Now.Calendar.get(Calendar.MONTH)
    var levyYear = Date.Now.LevyYear_ACC

    if (currentMonth < cutoffMonth) {
      return levyYear
    } else if (currentMonth > cutoffMonth) {
      return levyYear - 1
    }

    var cutoffDay = ScriptParameters.EarningsCutoffDay_ACC
    var currentDay = Date.Now.Calendar.get(Calendar.DAY_OF_MONTH)

    if (currentDay > cutoffDay) {
      return levyYear - 1
    } else {
      return levyYear
    }
  }

  private function evaluatePolicyStatus() {
    logInfo("Evaluating policy status")
    var currentLevyYear = DateUtil_ACC.getCurrentLevyYear()

    var latestBoundCurrentYear = _policyPeriod.LevyYear_ACC == currentLevyYear ?
        _policyPeriod : findMostRecentPeriodByLevyYear(_policyPeriod, currentLevyYear)
    if (latestBoundCurrentYear.INDCPXLineExists) {
      logInfo("CPX Line exists on latest bound current year")
      handleCPXPolicy()
      return
    }

    var ppYear1 : PolicyPeriod
    var ppYear2 : PolicyPeriod
    var ppYear3 : PolicyPeriod

    var cutoffLevyYear = getEarningsCutoffLevyYear()

    if (_policyPeriod.LevyYear_ACC == cutoffLevyYear) {
      ppYear1 = _policyPeriod
    } else {
      ppYear1 = findMostRecentPeriodByLevyYear(_policyPeriod, cutoffLevyYear)
    }

    if (_policyPeriod.LevyYear_ACC == cutoffLevyYear - 1) {
      ppYear2 = _policyPeriod
    } else {
      ppYear2 = findMostRecentPeriodByLevyYear(_policyPeriod, cutoffLevyYear - 1)
    }

    if (_policyPeriod.LevyYear_ACC == cutoffLevyYear - 2) {
      ppYear3 = _policyPeriod
    } else {
      ppYear3 = findMostRecentPeriodByLevyYear(_policyPeriod, cutoffLevyYear - 2)
    }

    if (_policy.Status_ACC == null) {
      logInfo("Policy status is null. Set status to Inactive")
      setStatus(PolicyStatus_ACC.TC_INACTIVE, null)
    }

    if (ppYear1.IsAEPMasterPolicy_ACC) {
      logInfo("AEP Master Policy. Set status to Inactive")
      setStatus(PolicyStatus_ACC.TC_INACTIVE, null)
      return
    }

    if (ppYear1.IsAEPMemberPolicy_ACC) {
      logInfo("AEP Member Policy")
      handleAEPMemberPolicy(ppYear1, ppYear2, ppYear3)
    } else if (ppYear1?.CeasedTrading_ACC or ppYear2?.CeasedTrading_ACC or ppYear3.CeasedTrading_ACC) {
      logInfo("Ceased")
      handleCeased(ppYear1, ppYear2, ppYear3)
    } else if (ppYear1?.INDCPXLineExists or ppYear2?.INDCPXLineExists or ppYear3?.INDCPXLineExists) {
      logInfo("CPX Policy")
      handleCPXPolicy()
    } else if (_policy.Status_ACC == PolicyStatus_ACC.TC_INACTIVE or _policy.Status_ACC == PolicyStatus_ACC.TC_ACTIVE) {
      logInfo("Current policy status is Inactive or Inactive")
      evaluateNewStatus(ppYear1, ppYear2, ppYear3)
    } else {
      logInfo("Current policy status is not Inactive or Inactive")
      evaluateNewStatus(ppYear1, ppYear2, ppYear3)
    }
  }

  private function handleAEPMemberPolicy(currentYr : PolicyPeriod, previousYr1 : PolicyPeriod, previousYr2 : PolicyPeriod) {
    var aepPolicyNumber = currentYr.Policy.Account.ACCID_ACC
    var aepPeriod = PolicyUtil_ACC.findMostRecentPeriodByACCPolicyIDAndLevyYear_ACC(aepPolicyNumber, currentYr.LevyYear_ACC)
    if (currentYr.getMemberAccount().AccountNumber == aepPeriod.AltBillingAccountNumber) {
      logInfo("AEP Prime. Set status to Active Levy Payer")
      setStatus(PolicyStatus_ACC.TC_ACTIVE, TC_LEVYPAYER)
    } else {
      logInfo("Not AEP Prime")
      handleActiveStatus(currentYr, previousYr1, previousYr2)
    }
  }

  private function handleCeased(currentYr : PolicyPeriod, previousYr1 : PolicyPeriod, previousYr2 : PolicyPeriod) {
    var currentYrHasEarnings = LiableEarningsUtilities_ACC?.isLiableEarningsNotAllZero(currentYr)
    var previousYr1HasEarnings = LiableEarningsUtilities_ACC?.isLiableEarningsNotAllZero(previousYr1)

    if (currentYr?.CeasedTrading_ACC) {
      setStatus(PolicyStatus_ACC.TC_CEASED, null)
    } else if (previousYr1?.CeasedTrading_ACC and currentYrHasEarnings) {
      evaluateNewStatus(currentYr, previousYr1, previousYr2)
    } else if (previousYr2?.CeasedTrading_ACC and (previousYr1HasEarnings or currentYrHasEarnings)) {
      evaluateNewStatus(currentYr, previousYr1, previousYr2)
    } else {
      setStatus(PolicyStatus_ACC.TC_CEASED, null)
    }
  }

  private function handleCPXPolicy() {
    logInfo("CPXPolicy - set status to Active Levy Payer")
    setStatus(PolicyStatus_ACC.TC_ACTIVE, TC_LEVYPAYER)
  }

  private function evaluateNewStatus(currentYr : PolicyPeriod, previousYr1 : PolicyPeriod, previousYr2 : PolicyPeriod) {
    if (!checkLeviesAndUpdateStatus(currentYr, previousYr1, previousYr2)) {
      checkEarningsAndUpdateStatus(LiableEarningsUtilities_ACC.isLiableEarningsNotAllZero(currentYr, true),
          LiableEarningsUtilities_ACC.isLiableEarningsNotAllZero(previousYr1, true),
          LiableEarningsUtilities_ACC.isLiableEarningsNotAllZero(previousYr2, true))
    }
  }

  private function checkEarningsAndUpdateStatus(currentYr : boolean, previousYr1 : boolean, previousYr2 : boolean) {
    if (currentYr || previousYr1 || previousYr2) {
      logInfo("checkEarningsAndUpdateStatus - set status to Active Earner")
      setStatus(PolicyStatus_ACC.TC_ACTIVE, TC_EARNER)
    } else {
      if (_policy.IsWithinNewCustomerActiveStatusGracePeriod_ACC) {
        logInfo("checkEarningsAndUpdateStatus - policy is within new customer active status grace period - set status to Active New Customer")
        setStatus(PolicyStatus_ACC.TC_ACTIVE, ActiveReason_ACC.TC_NEWCUSTOMER)
      } else {
        logInfo("checkEarningsAndUpdateStatus - set status to Inactive")
        setStatus(PolicyStatus_ACC.TC_INACTIVE, null)
      }
    }
  }

  private function handleActiveStatus(currentYr : PolicyPeriod, previousYr1 : PolicyPeriod, previousYr2 : PolicyPeriod) {
    if (!checkLeviesAndUpdateStatus(currentYr, previousYr1, previousYr2)) {
      evaluateNewStatus(currentYr, previousYr1, previousYr2)
    }
  }

  private function checkLeviesAndUpdateStatus(currentYr : PolicyPeriod, previousYr1 : PolicyPeriod, previousYr2 : PolicyPeriod) : boolean {
    var thresholdAmount = ScriptParameters.PremiumThresholdEmployerReassessment_ACC
    if (currentYr.INDCoPLineExists) {
      thresholdAmount = ScriptParameters.PremiumThresholdSelfEmployedReassessment_ACC
    }

    if ((currentYr?.TotalCostRPT_amt >= thresholdAmount) or
        (previousYr1?.TotalCostRPT_amt >= thresholdAmount) or
        (previousYr2?.TotalCostRPT_amt >= thresholdAmount)) {
      logInfo("Levy above premium threshold. Set status to Active Levy Payer")
      setStatus(PolicyStatus_ACC.TC_ACTIVE, ActiveReason_ACC.TC_LEVYPAYER)
      return true
    }
    logInfo("Levy below premium threshold")
    return false
  }

  private function setStatus(status : PolicyStatus_ACC, reason : ActiveReason_ACC) {
    if (_policy.Status_ACC != status or _policy.ActiveReason_ACC != reason) {
      LOG.info("Updating policy ${_policyPeriod.PolicyNumber} status from ${_policy.Status_ACC}/${_policy.ActiveReason_ACC} to ${status}/${reason}")
    }
    _policy.Status_ACC = status
    _policy.ActiveReason_ACC = reason
  }

  private function logInfo(msg : String) {
    LOG.info("${_policy.Account.ACCID_ACC} : ${_policyPeriod.PolicyNumber} : ${_policyPeriod.LevyYear_ACC} : ${_policyPeriod.Status} : ${msg}")
  }

  private static function findMostRecentPeriodByLevyYear(policyPeriod : PolicyPeriod, levyYear : int) : PolicyPeriod {
    return policyPeriod.Policy.PolicyTermFinder_ACC
        .findPolicyTermForLevyYear(levyYear)
            ?.findLatestBoundOrAuditedPeriod_ACC()
  }

}