package nz.co.acc.workqueue

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.processes.WorkQueueBase
uses gw.surepath.suite.integration.logging.StructuredLogger

/**
 * This work queue targerts policies with policy status Active and reason New Customer
 * that have passed the grace period of 24 months after policy creation date
 * and updates the status to Inactive
 *
 */
class UpdateNewCustomerPolicyStatusWorkQueue_ACC extends WorkQueueBase<Policy, StandardWorkItem> {
  private static var LOG = StructuredLogger.CONFIG.withClass(UpdateNewCustomerPolicyStatusWorkQueue_ACC)

  construct() {
    super(BatchProcessType.TC_UPDATENEWCUSTOMERPOLICYSTATUS_ACC, StandardWorkItem, Policy)
  }


  override function findTargets() : Iterator<Policy> {

    var activeStatusGracePeriodEndDate = Date.Today.addMonths(-1 * ScriptParameters.NewCustomersActivePolicyGracePeriodMonth_ACC)

    LOG.info("Finding target Policy items to process with policy creation date on or before ${activeStatusGracePeriodEndDate.toISODate()}. " +
        "Script Parameter NewCustomersActivePolicyGracePeriodMonth_ACC=${ScriptParameters.NewCustomersActivePolicyGracePeriodMonth_ACC}. ")

    var pQuery = Query.make(Policy)
        .compare(Policy#Status_ACC, Relop.Equals, PolicyStatus_ACC.TC_ACTIVE)
        .compare(Policy#ActiveReason_ACC, Relop.Equals, ActiveReason_ACC.TC_NEWCUSTOMER)
        .compare(Policy#IssueDate, Relop.LessThanOrEquals, activeStatusGracePeriodEndDate)
        .withDistinct(true)

    return pQuery.select().iterator()
  }


  override function processWorkItem(workItem : StandardWorkItem) {
    var policy = extractTarget(workItem)
    var statusBefore = policy.DisplayPolicyStatus_ACC
    var statusAfter : String = null

    // don't update the workitem in case the policy status has changed compared to when was picked up by findTarget
    if (not policy.IsActiveNewCustomer_ACC) {
      LOG.info("Policy status of policy ${policy.PublicID} is not anymore  'Active - New Customer' ")
      return
    }

    try {
      gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
        policy = bundle.add(policy)
        policy.Status_ACC = PolicyStatus_ACC.TC_INACTIVE
        policy.ActiveReason_ACC = null
        statusAfter = policy.DisplayPolicyStatus_ACC

        var account = policy.Account
        account = bundle.add(account)
        account.StatusWorkQueuePending_ACC = true

      })
      LOG.info("Policy status updated for policy ${policy.PublicID}. Changed from ${statusBefore} to ${statusAfter}. Policy issue date is ${policy.IssueDate.toISODate()}")

    } catch (e : Exception) {
      LOG.error_ACC("Failed to update Policy Status of policy ${policy.PublicID}", e)
      throw e
    }

  }

}