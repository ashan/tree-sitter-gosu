package nz.co.acc.lob.common.workqueue

uses gw.job.uw.UWAuthorityBlocksProgressException
uses gw.pl.persistence.core.Bundle
uses gw.processes.WorkQueueBase
uses nz.co.acc.common.util.HikariJDBCConnectionPool
uses nz.co.acc.job.audit.AuditHelper_ACC
uses nz.co.acc.lob.common.DateUtil_ACC

uses gw.surepath.suite.integration.logging.StructuredLogger

uses java.lang.invoke.MethodHandles

/**
 * Batch job to refund provisional levies.
 */
abstract class RefundProvisionalLevies_ACC extends WorkQueueBase<PolicyPeriod, StandardWorkItem> {
  private static final var _logger = StructuredLogger.CONFIG.withClass(MethodHandles.lookup().lookupClass())
  construct(batchProcessType: BatchProcessType) {
    super(batchProcessType, StandardWorkItem, PolicyPeriod)
  }

  protected function logInfo(fn: String, msg: String) {
_logger.info(msg)
  }

  protected function logDebug(fn: String, msg: String) {
    _logger.debug(msg)
  }

  protected function logError(fn: String, msg: String) {
    _logger.error_ACC(msg)
  }

  protected function findTargetsForPolicyLine(
      policyLine: String,
      levyYearScriptParam: String): Iterator<PolicyPeriod> {
    final var fn = "findTargets"

    logDebug(fn, "Finding ${policyLine} Refund Provisional Levies targets")

    var levyYear = ScriptParameters.getParameterValue(levyYearScriptParam) as Integer
    var currentLevyYear = DateUtil_ACC.getCurrentLevyYear()
    if (levyYear >= currentLevyYear) {
      var msg = "The levy year ${levyYear} is greater than or equal to the current levy year ${currentLevyYear}. "
          + "The levy year must be less than the current levy year."
      logError(fn, msg)
      throw new IllegalArgumentException(msg)
    }

    return findTargetsForPolicyLine(policyLine, levyYear)
  }

  /**
   * This method finds the policy terms for processing.
   *
   * @param policyLine     the policy line
   * @param startLevyYear  the starting levy year. Levy years >= than this year will be returned
   * @return the found policy terms
   */
  private function findTargetsForPolicyLine(policyLine: String, levyYear: int): Iterator<PolicyPeriod> {
    final var fn = "findTargetsForPolicyLine"
    var connectionPool = HikariJDBCConnectionPool.getInstance()
    var connection = connectionPool.getConnection()
    connection.setReadOnly(true)
    var sql = RefundProvisionalLeviesSelectQuery.renderToString(policyLine, levyYear)

    logDebug(fn, sql)

    var statement = connection.prepareStatement(sql)
    try {
      var resultSet = statement.executeQuery()
      var policyPeriodIds: LinkedList<Long> = {}
      while (resultSet.next()) {
        policyPeriodIds.add(resultSet.getLong(1))
      }
      logInfo(fn, "Found ${policyPeriodIds.size()} PolicyPeriod IDs to process")
      return new PolicyPeriodIterator(policyPeriodIds.iterator())
    } catch (e: Exception) {
      throw e
    } finally {
      statement.close()
      connection.close()
    }
  }

  /**
   * This method will receive the target WPC/WPS Refund Provisional Levies Policy Periods.
   *
   * @param workItem
   */
  override function processWorkItem(workItem: StandardWorkItem) {
    final var fn = "processWorkItem"
    logInfo(fn, "Started processing: ${workItem.QueueType}, id=${workItem.ID}, "
        + "attempts=${workItem.Attempts}, retries=${workItem.NumRetries}")

    var policyPeriod: PolicyPeriod
    try {
      policyPeriod = extractTarget(workItem)
      policyPeriod = policyPeriod.getSlice(policyPeriod.EditEffectiveDate)

    } catch (e: IllegalArgumentException) {
      logError(fn, "IllegalArgumentException occured when processing work item "
          + "id=${workItem.ID}\n${e.Class}\n${e.Message}\n${e.StackTraceAsString}")
      return
    }
    processWorkItem(policyPeriod)
    logInfo(fn, "Finished processing: ${workItem.QueueType}, id=${workItem.ID}")
  }

  private function processWorkItem(policyPeriod: PolicyPeriod) {
    var fn = "processWorkItem"
    logInfo(fn, "Policy Number: ${policyPeriod.PolicyNumber}")

    var shouldCeaseFA = ScriptParameters.getParameterValue("RefundProvisionalLeviesCeaseFinalAudit_ACC") as Boolean
    var ceaseFAStartYear = ScriptParameters.getParameterValue("RefundProvisionalLeviesCeaseFinalAuditStartYear_ACC") as Integer
    var previousLevyYear = policyPeriod.LevyYear_ACC - 1
    var previousFinalAuditPolicyPeriod = findLatestCompletedFinalAuditPeriodForLevyYear(policyPeriod.Policy, previousLevyYear)

    if (!canProcessWorkItem(policyPeriod, previousFinalAuditPolicyPeriod, shouldCeaseFA, ceaseFAStartYear)) {
      return
    }
    ceaseFinalAuditAndPolicyTerm(previousFinalAuditPolicyPeriod, shouldCeaseFA, ceaseFAStartYear)
    logInfo(fn, "Refunding provisional levies: ${policyPeriod}")
    try {
      AuditHelper_ACC.updateProvisionalRefund(policyPeriod)
    } catch (e: UWAuthorityBlocksProgressException) {
      logInfo(fn, "Underwriting rules require approval for policy change.")
    }
  }

  private function canProcessWorkItem(
      policyPeriod: PolicyPeriod,
      previousFAPolicyPeriod: PolicyPeriod,
      shouldCeaseFA: Boolean,
      ceaseFAStartYear: Integer): Boolean {

    final var fn = "canProcessWorkItem"

    if (previousFAPolicyPeriod == null) {
      logInfo(fn, "Previous year completed Final Audit does not exist. Skipping work item.")
      return false
    }

    if (shouldCeaseFA && ceaseFAStartYear <= previousFAPolicyPeriod.LevyYear_ACC) {
      if (policyPeriod.Policy.hasDraftFinalAuditForLevyYear_ACC(previousFAPolicyPeriod.LevyYear_ACC)) {
        logInfo(fn, "Previous year draft Final Audit exists. Skipping work item.")
        return false
      }
    }

    if (policyPeriod.Policy.hasDraftPolicyChangeForLevyYear_ACC(policyPeriod.LevyYear_ACC)) {
      logInfo(fn, "Draft PolicyChange exists. Skipping work item.")
      return false
    }

    return true
  }

  private function ceaseFinalAuditAndPolicyTerm(policyPeriod: PolicyPeriod, shouldCeaseFA: Boolean, ceaseFAStartYear: Integer) {
    final var fn = "ceaseFinalAuditAndPolicyTerm"

    if (shouldCeaseFA and policyPeriod.LevyYear_ACC >= ceaseFAStartYear) {
      logInfo(fn, "Ceasing previous final audit: " + policyPeriod)
      try {
        AuditHelper_ACC.ceaseFinalAuditWithFinalAuditRevision(policyPeriod)
      } catch (e: UWAuthorityBlocksProgressException) {
        logInfo(fn, "Underwriting rules require approval for final audit revision.")
      }
      // update the reference to the policy term so the correct version has the cease date added later in the setCeaseData method
      logInfo(fn, "Ceasing previous policy term for policy number: ${policyPeriod.PolicyNumber}")
      setCeaseData(policyPeriod.PolicyTerm, policyPeriod.PeriodEnd)
    }
  }

  private function findLatestCompletedFinalAuditPeriodForLevyYear(policy: Policy, levyYear: int): PolicyPeriod {
    var finalAudit = policy.CompletedFinalAuditPeriods_ACC.firstWhere(\pp -> pp.LevyYear_ACC == levyYear)
    if (finalAudit != null) {
      return finalAudit
    } else {
      // search for previous policies not part of current policy
      var issuedPolicySummary = policy.Account.IssuedPolicies.firstWhere(\issuedPolicy -> issuedPolicy.ProductCode == policy.ProductCode and issuedPolicy.LevyYear_ACC == levyYear)
      if (issuedPolicySummary != null) {
        var issuedPolicy = issuedPolicySummary.fetchPolicyPeriod().Policy
        if (issuedPolicy != null) {
          return issuedPolicy.CompletedFinalAuditPeriods_ACC.firstWhere(\pp -> pp.LevyYear_ACC == levyYear)
        }
      }
      return null
    }
  }

  private function setCeaseData(policyTerm: PolicyTerm, periodEnd: Date): PolicyTerm {
    var bundle: Bundle
    gw.transaction.Transaction.runWithNewBundle(\b -> {
      bundle = b
    })

    var updatedPolicyTerm = bundle.add(policyTerm)
    updatedPolicyTerm.CeasedTradingDate_ACC = periodEnd
    bundle.commit()

    return updatedPolicyTerm
  }
}
