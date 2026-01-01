package nz.co.acc.workqueue.datafix

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.processes.WorkQueueBase
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.edge.capabilities.policy.util.PolicyUtil_ACC

class InitialiseNewCustomerPolicyStatusWorkQueue_ACC extends WorkQueueBase<Policy, StandardWorkItem> {
  private static var LOG = StructuredLogger.CONFIG.withClass(InitialiseNewCustomerPolicyStatusWorkQueue_ACC)

  construct() {
    super(BatchProcessType.TC_INITIALIZENEWCUSTOMERPOLICYSTATUS_ACC, StandardWorkItem, Policy)
  }


  override function findTargets() : Iterator<Policy> {

    var activeStatusGracePeriodStartDate = Date.Today.addMonths(-1 * ScriptParameters.NewCustomersActivePolicyGracePeriodMonth_ACC)


    LOG.info("Finding target Policy items to process created after ${activeStatusGracePeriodStartDate.toISODate()}. " +
        "Script Parameter NewCustomersActivePolicyGracePeriodMonth_ACC=${ScriptParameters.NewCustomersActivePolicyGracePeriodMonth_ACC}. ")

    var pQuery = Query.make(Policy)
        .compare(Policy#Status_ACC, Relop.Equals, PolicyStatus_ACC.TC_INACTIVE)
        .compare(Policy#IssueDate, Relop.GreaterThan, activeStatusGracePeriodStartDate)
        .withDistinct(true)

    return pQuery.select().iterator()
  }


  override function processWorkItem(workItem : StandardWorkItem) {
    var policy = extractTarget(workItem)
    LOG.info("Processing Policy ${policy.PublicID}")

    if (policy.IsAEPMasterPolicy_ACC) {
      LOG.info("Policy ${policy.PublicID} policy status not updated because is AEP Master")
      return
    }

    var mostRecentPolicyTerm = policy.PolicyTermFinder_ACC.findMostRecentPolicyTerm()
    if (mostRecentPolicyTerm == null) {
      LOG.error_ACC("Unable to find most recent policy term for policy ${policy.PublicID}")
      throw new RuntimeException("Unable to find most recent policy term for policy ${policy.PublicID}")
    }

    var lastPolicyPeriod = mostRecentPolicyTerm.findLatestBoundOrAuditedPeriod_ACC()

    if(lastPolicyPeriod.isCanceled()) {
      LOG.info("Policy ${policy.PublicID} policy status not updated because is cancelled")
      return
    }

    if (this.isCeasedInLastFourTerms(lastPolicyPeriod)) {
      LOG.info("Policy ${policy.PublicID} policy status not updated because is inactive due to ceasing")
      return
    }

    try {
      gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
        policy = bundle.add(policy)
        policy.Status_ACC = PolicyStatus_ACC.TC_ACTIVE
        policy.ActiveReason_ACC = ActiveReason_ACC.TC_NEWCUSTOMER

        var account = policy.Account
        if (not account.StatusWorkQueuePending_ACC) {
          account = bundle.add(account)
          account.StatusWorkQueuePending_ACC = true
        }

      })
      LOG.info("Policy ${policy.PublicID} policy status updated. Retry counter: ${workItem.NumRetries}. Policy issue date is ${policy.IssueDate.toISODate()}")

    } catch (e : Exception) {
      LOG.error_ACC("Failed to update Policy Status of policy ${policy.PublicID}. Retry counter: ${workItem.NumRetries}. WorkItem: ${workItem.ID}", e)
      throw e
    }

  }


  private function isCeasedInLastFourTerms(policyPeriodYear1 : PolicyPeriod) : Boolean {

    if (policyPeriodYear1.CeasedTrading_ACC) {
      return true
    }

    var latestLevyYear = policyPeriodYear1.LevyYear_ACC
    var policyNumber = policyPeriodYear1.PolicyNumber

    var policyPeriodYear2 = PolicyUtil_ACC.getMostRecentPeriodByLevyYear_ACC(policyNumber, latestLevyYear - 1)
    if (policyPeriodYear2.CeasedTrading_ACC) {
      return true
    }

    var policyPeriodYear3 = PolicyUtil_ACC.getMostRecentPeriodByLevyYear_ACC(policyNumber, latestLevyYear - 2)
    if (policyPeriodYear3.CeasedTrading_ACC) {
      return true
    }

    var policyPeriodYear4 = PolicyUtil_ACC.getMostRecentPeriodByLevyYear_ACC(policyNumber, latestLevyYear - 3)
    if (policyPeriodYear4.CeasedTrading_ACC) {
      return true
    }

    return false
  }

}