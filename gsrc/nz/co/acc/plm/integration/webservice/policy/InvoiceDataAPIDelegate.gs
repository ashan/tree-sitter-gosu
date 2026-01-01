package nz.co.acc.plm.integration.webservice.policy

uses gw.api.database.Query
uses gw.api.gx.GXOptions
uses gw.api.webservice.exception.BadIdentifierException
uses gw.api.webservice.exception.EntityStateException
uses gw.api.webservice.exception.RequiredFieldException
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.plm.integration.webservice.address.CorrespondenceDetailsUtil
uses nz.co.acc.plm.integration.webservice.policy.exception.ZeroValueInvoiceException
uses nz.co.acc.plm.integration.webservice.policy.util.InvoiceDataAPIUtil
uses nz.co.acc.plm.integration.webservice.policy.util.PolicyPeriodGxModelUtil
uses nz.co.acc.plm.integration.webservice.policy.util.PolicyPeriodUtil
uses nz.co.acc.util.FeatureToogleUtil

/**
 * Provides data for Billing Center invoice generation
 */
class InvoiceDataAPIDelegate {
  private var ZERO = 0.00bd
  private var _verboseTestLoggingEnabled : Boolean = false
  private var _correspondenceAddressUtil = new CorrespondenceDetailsUtil()

  public construct() {
  }

  public function withVerboseTestLoggingEnabled() : InvoiceDataAPIDelegate {
    _verboseTestLoggingEnabled = true
    return this
  }

  function getInvoiceData(
      accountNumber : String,
      provisionalTransactions : List<String>,
      auditTransactions : List<String>) : nz.co.acc.plm.integration.webservice.gxmodel.policyperiodmodel.PolicyPeriod[] {
    final var fn = "getInvoiceData"
    logInfo(fn, "Request: accountNumber=${accountNumber}, provTxns=[${provisionalTransactions?.join(',')}], auditTxns=[${auditTransactions?.join(',')}]")

    if (provisionalTransactions.isEmpty() and auditTransactions.isEmpty()) {
      throw new RequiredFieldException("Required fields 'provisionalTransactions' and 'auditTransactions' are both null.")
    }

    logPolicyPeriods(provisionalTransactions, auditTransactions)

    var result = new nz.co.acc.plm.integration.webservice.gxmodel.policyperiodmodel.PolicyPeriod[2]
    if (provisionalTransactions?.HasElements) {
      result[0] = getInvoiceDataForPolicyTerm(accountNumber, provisionalTransactions.toList())
    }
    if (auditTransactions?.HasElements) {
      result[1] = getInvoiceDataForPolicyTerm(accountNumber, auditTransactions.toList())
    }

    if (result[0] == null and result[1] == null) {
      throw new ZeroValueInvoiceException("Invoice contains net zero transactions")
    }

    validateFinalAndProvisionalLevyYears(result[0]?.PeriodEnd, result[1]?.PeriodEnd)

    return result
  }

  function logPolicyPeriods(provisionalTransactions : List<String>, auditTransactions : List<String>) {
    if (_verboseTestLoggingEnabled or StructuredLogger.INTEGRATION.DebugEnabled) {
      final var fn = "logPolicyPeriods"
      try {
        var table = InvoiceDataAPIUtil.getTableForTestLogging(provisionalTransactions.toList(), auditTransactions.toList())
        if (_verboseTestLoggingEnabled) {
          logInfo(fn, table)
        } else {
          logDebug(fn, table)
        }
      } catch (e : Exception) {
        logError(fn, "Failed to create table printout", e)
      }
    }
  }

  function validateFinalAndProvisionalLevyYears(provisionalPeriodEnd : Date, finalPeriodEnd : Date) {
    if (finalPeriodEnd != null and provisionalPeriodEnd != null) {
      var finalLevyYear = finalPeriodEnd.LevyYear_ACC
      var provisionalLevyYear = provisionalPeriodEnd.LevyYear_ACC

      if (finalLevyYear == provisionalLevyYear)
        throw new EntityStateException("Provisional and final transactions are in the same levy year ${finalLevyYear}")

      if (provisionalLevyYear != (finalLevyYear + 1)) {
        throw new EntityStateException(
            "Final levy year ${finalLevyYear} and provisional levy year ${provisionalLevyYear} are not consecutive. "
                + "Provisional period must be the next year after the Final period.")
      }
    }
  }

  private function getInvoiceDataForPolicyTerm(
      accID : String,
      policyTransactionIDs : List<String>) : nz.co.acc.plm.integration.webservice.gxmodel.policyperiodmodel.PolicyPeriod {
    final var fn = "getInvoiceDataForPolicyTerm"

    var policyPeriods = findPeriodsByJobNumbers(policyTransactionIDs)

    if (StructuredLogger.INTEGRATION.DebugEnabled) {
      logDebug(fn, "accID=${accID}, policyTransactionIDs=${policyTransactionIDs.join(',')}")
      logDebug(fn, "Found periods [${policyPeriods.map(\p -> p.PublicID).join(',')}]")
    }

    validateAllPeriodsFound(policyPeriods, policyTransactionIDs)
    validatePolicyPeriodsInSamePolicyTerm(policyPeriods)
    validateTransactionSetIsFinalOrProvisionalOnly(policyPeriods)

    removeAuditReversalPairs(policyPeriods)

    if (policyPeriods.isEmpty()) {
      // Could be empty after removing audit reversal pairs
      return null
    } else if (policyPeriods.hasMatch(\pp -> pp.isAuditReversal_ACC)) {
      return getDataForAuditReversal(accID, policyPeriods)
    } else {
      return getDataForConsecutiveTransactions(accID, policyPeriods)
    }
  }

  /**
   * Assumptions:
   * 1. All transactions on invoice are reversals
   * <p>
   * 2.If there are multiple reversals on the invoice, the most recent reversal transaction
   * rolls back to the period that the invoice should be based on
   */
  private function getDataForAuditReversal(
      accID : String,
      policyPeriods : List<PolicyPeriod>) : nz.co.acc.plm.integration.webservice.gxmodel.policyperiodmodel.PolicyPeriod {
    final var fn = "getDataForAuditReversal"

    if (policyPeriods.hasMatch(\pp -> not pp.isAuditReversal_ACC)) {
      throw new EntityStateException("Audit reversals must be processed on a separate invoice without other transaction types")
    }

    var reversedCosts = policyPeriods.sum(Currency.TC_NZD, \auditReversal -> auditReversal.TransactionCostRPT)

    // find period that the reversals roll back to
    var oldestAudit = policyPeriods
        .minBy(\pp -> pp.BasedOn.ID)
        .BasedOn

    var mostRecentAudit = policyPeriods
        .maxBy(\pp -> pp.BasedOn.ID)
        .BasedOn

    // selects the original period that the reversed audit was based on
    var reversalBasedOn = oldestAudit.BasedOn

    var data = generatePolicyModel(reversalBasedOn)
    data.TransactionCostRPT.Amount = reversedCosts.Amount
    updateAddressForAEPPolicy(reversalBasedOn, accID, data)
    replaceBasedOnGSTCost(data, Optional.of(mostRecentAudit))
    return data
  }

  private function getDataForConsecutiveTransactions(
      accID : String,
      policyPeriods : List<PolicyPeriod>) : nz.co.acc.plm.integration.webservice.gxmodel.policyperiodmodel.PolicyPeriod {
    final var fn = "getDataForConsecutiveTransactions"

    validatePolicyTransactionsAreConsecutive(policyPeriods)

    var earliestPeriod = getEarliestPeriod(policyPeriods)
    var previousPeriod = earliestPeriod.BasedOn
    var latestPeriod = getLatestPeriod(policyPeriods)
    if (StructuredLogger.INTEGRATION.DebugEnabled) {
      logDebug(fn, "previousPeriod=${previousPeriod.PublicID}, earliestPeriod=${earliestPeriod.PublicID}, latestPeriod=${latestPeriod.PublicID}")
    }

    var data = generatePolicyModel(latestPeriod)
    updateAddressForAEPPolicy(latestPeriod, accID, data)
    if (policyPeriods.Count > 1) {
      updateTransactionCostSum(data, policyPeriods)
      updateBasedOnValues(data, previousPeriod)
    }
    updateBasedOnValuesForTaxInvoice(data, earliestPeriod)
    replaceLEWithActualForCPCPX(latestPeriod, data)

    return data
  }

  /**
   * Removes pairs of audit transactions (p1, p2) from the list of policy periods
   * such that p1 is an audit reversal of p2.
   * <p>
   * These pairs combined have net transaction cost = zero.
   *
   * @param policyPeriods
   */
  private function removeAuditReversalPairs(policyPeriods : List<PolicyPeriod>) {
    final var fn = "removeAuditReversalPairs"
    var auditReversals = policyPeriods.where(\pp -> pp.isAuditReversal_ACC)
    for (reversal in auditReversals) {
      var basedOnID = reversal.BasedOn.ID
      if (policyPeriods.hasMatch(\pp -> pp.ID == basedOnID)) {
        if (StructuredLogger.INTEGRATION.DebugEnabled) {
          logDebug(fn, "Removing reversal id=${reversal.ID} and basedOn id=${basedOnID} from list")
        }
        policyPeriods.removeWhere(\pp -> pp.ID == basedOnID or pp.ID == reversal.ID)
      }
    }
  }

  private function getLatestPeriod(policyPeriods : List<PolicyPeriod>) : PolicyPeriod {
    var latestPeriod = policyPeriods.first()
    latestPeriod = latestPeriod.getSlice(latestPeriod.EditEffectiveDate)
    return latestPeriod
  }

  private function getEarliestPeriod(policyPeriods : List<PolicyPeriod>) : PolicyPeriod {
    return policyPeriods.last()
  }

  private function validateAllPeriodsFound(policyPeriods : List<PolicyPeriod>, jobNumbers : List<String>) {
    if (policyPeriods?.Count != jobNumbers.Count) {
      var foundJobNumbers = policyPeriods.map(\policyPeriod -> policyPeriod.Job.JobNumber).toSet()
      var invalidJobNumbers = jobNumbers.copy()
      invalidJobNumbers.removeAll(foundJobNumbers)
      throw new BadIdentifierException("Policy transactions not found: [${invalidJobNumbers.join(',')}]")
    }
  }

  private function validatePolicyPeriodsInSamePolicyTerm(policyPeriods : List<PolicyPeriod>) {
    var policyTerms = policyPeriods.map(\pp -> pp.PolicyTerm).toSet()
    if (policyTerms.Count > 1) {
      throw new EntityStateException("All policy transactions must have the same policy term")
    }
  }

  private function validateTransactionSetIsFinalOrProvisionalOnly(policyPeriods : List<PolicyPeriod>) {
    var hasFinal = policyPeriods.hasMatch(\pp -> pp.isAudited_ACC)
    var hasProvisional = policyPeriods.hasMatch(\pp -> pp.isBound_ACC)
    if (hasFinal and hasProvisional) {
      throw new EntityStateException("Set of transactions must contain only provisional or final transactions")
    }
  }

  /**
   * Verifies that all policy periods in the list are linked via the 'basedOn' relation.
   *
   * @param policyPeriods
   */
  private function validatePolicyTransactionsAreConsecutive(policyPeriods : List<PolicyPeriod>) {
    if (policyPeriods.size() <= 1) {
      return
    }

    var actualBasedOnPeriod = policyPeriods.first()
    var nonZeroBasedOnPeriod = policyPeriods.first()

    for (var _ in 1..policyPeriods.Count - 1) {
      nonZeroBasedOnPeriod = getNextBasedOnPeriodWithNonZeroTransactionCost(nonZeroBasedOnPeriod)
      actualBasedOnPeriod = actualBasedOnPeriod.BasedOn

      if (not policyPeriods.contains(nonZeroBasedOnPeriod)
          and not policyPeriods.contains(actualBasedOnPeriod)) {

        throw new EntityStateException("Policy transactions are not consecutive")
      }
    }
  }

  /**
   * Traverses the linked list of basedOn periods and returns the next period with non-zero transaction cost
   *
   * @param policyPeriod
   * @return
   */
  private function getNextBasedOnPeriodWithNonZeroTransactionCost(policyPeriod : PolicyPeriod) : PolicyPeriod {
    var basedOn = policyPeriod.BasedOn
    while (basedOn != null and basedOn.TransactionCostRPT_amt.IsZero) {
      basedOn = basedOn.BasedOn
    }
    return basedOn
  }

  private function updateTransactionCostSum(
      info : nz.co.acc.plm.integration.webservice.gxmodel.policyperiodmodel.PolicyPeriod,
      periods : List<PolicyPeriod>) {
    var transactionCosts = periods.map(\pp -> pp.TransactionCostRPT).filterNulls()
    var transactionCostSum = transactionCosts.sum()
    info.TransactionCostRPT.Amount = transactionCostSum.Amount
  }

  private function replaceLEWithActualForCPCPX(
      period : PolicyPeriod,
      info : nz.co.acc.plm.integration.webservice.gxmodel.policyperiodmodel.PolicyPeriod) {
    final var fn = "replaceLEWithActualForCPCPX"

    if (period.INDCoPLineExists) {
      if (period.CeasedTrading_ACC) {
        if (StructuredLogger.INTEGRATION.DebugEnabled) {
          logDebug(fn, "CeasedTrading_ACC=true for CPCPX period. Replacing liable earnings with actual liable earnings")
        }
        replaceLEwithActualLEForCP(info)

      } else if (period.IsNewLERuleAppliedYear) {
        if (StructuredLogger.INTEGRATION.DebugEnabled) {
          logDebug(fn, "IsNewLERuleAppliedYear=true for CPCPX period. Replacing liable earnings with actual liable earnings")
        }
        replaceLEwithActualLEForCP(info)
      }
    }
  }

  private function findPeriodsByJobNumbers(jobNumbers : List<String>) : List<PolicyPeriod> {
    return Query.make(entity.PolicyPeriod)
        .compareIn(entity.PolicyPeriod#Status, {PolicyPeriodStatus.TC_BOUND, PolicyPeriodStatus.TC_AUDITCOMPLETE})
        .join(entity.PolicyPeriod#Job)
        .compareIn(entity.Job#JobNumber, jobNumbers.toTypedArray())
        .select()
        .toList()
        .orderByDescending(\pp -> pp.ModelDate != null ? pp.ModelDate : pp.UpdateTime)
  }

  private function generatePolicyModel(
      policyPeriod : PolicyPeriod) : nz.co.acc.plm.integration.webservice.gxmodel.policyperiodmodel.PolicyPeriod {
    var _gxOpts = new GXOptions()
    _gxOpts.Incremental = false
    _gxOpts.Verbose = false
    _gxOpts.SuppressExceptions = false
    return new nz.co.acc.plm.integration.webservice.gxmodel.policyperiodmodel.PolicyPeriod(policyPeriod, _gxOpts)
  }

  private function updateAddressForAEPPolicy(
      policyPeriod : PolicyPeriod,
      accID : String,
      data : nz.co.acc.plm.integration.webservice.gxmodel.policyperiodmodel.PolicyPeriod) {

    //when policy owner is not the invoice account, load the account address
    if (policyPeriod.Policy.Account.ACCID_ACC != accID) {
      //get AEP prime member address
      var correspondenceDetails = _correspondenceAddressUtil.getCorrespondenceDetails(accID, policyPeriod.getPolicyAddressType())
      data.PolicyInvoiceAddress.Attention_ACC = correspondenceDetails.Attention_ACC
      data.PolicyInvoiceAddress.AddressLine1 = correspondenceDetails.AddressLine1
      data.PolicyInvoiceAddress.AddressLine2 = correspondenceDetails.AddressLine2
      data.PolicyInvoiceAddress.AddressLine3 = correspondenceDetails.AddressLine3
      data.PolicyInvoiceAddress.City = correspondenceDetails.City
      data.PolicyInvoiceAddress.State.DisplayName = correspondenceDetails.State?.DisplayName
      data.PolicyInvoiceAddress.PostalCode = correspondenceDetails.PostalCode
      data.PolicyInvoiceAddress.Country.DisplayName = correspondenceDetails.Country?.DisplayName
      data.PolicyInvoiceAddress.AddressValidUntil = correspondenceDetails.AddressValidUntil
      data.PolicyInvoiceAddress.PrimaryEmail = correspondenceDetails.PrimaryEmail
      data.PolicyInvoiceAddress.IsEmailVerified = correspondenceDetails.IsEmailVerified
      data.PolicyInvoiceAddress.CorrespondencePreference = correspondenceDetails.CorrespondencePreference
    }
  }

  private function updateBasedOnValuesForTaxInvoice(
      info : nz.co.acc.plm.integration.webservice.gxmodel.policyperiodmodel.PolicyPeriod,
      earliestPeriod : PolicyPeriod) {
    final var fn = "updateBasedOnValuesForTaxInvoice"

    var previousPeriod = getNextBasedOnPeriodWithNonZeroTransactionCost(earliestPeriod)

    if (StructuredLogger.INTEGRATION.DebugEnabled) {
      logDebug(fn, "previousPeriodID=${previousPeriod.PublicID}, earliestPeriodID=${earliestPeriod.PublicID}")
      logDebug(fn, "previousPeriodJobType=${previousPeriod.Job.Subtype}, earliestPeriodJobType=${earliestPeriod.Job.Subtype}")
      logDebug(fn, "previousPeriodLevyYear=${previousPeriod.LevyYear_ACC}, earliestPeriodLevyYear=${earliestPeriod.LevyYear_ACC}")
    }

    var isTaxInvoice = false

    if (previousPeriod == null) {
      logDebug(fn, "Tax invoice. Setting basedOn values to zero")
      isTaxInvoice = true

    } else if (earliestPeriod.isAudited_ACC and previousPeriod.isBound_ACC and not previousPeriod.isPolicyChange_ACC) {
      logDebug(fn, "Tax final invoice. Setting basedOn values to zero")
      isTaxInvoice = true

    } else if (isProvisional(earliestPeriod) and earliestPeriod.LevyYear_ACC != previousPeriod.LevyYear_ACC) {
      logDebug(fn, "Tax provisional invoice. Setting basedOn values to zero")
      isTaxInvoice = true
    }

    if (isTaxInvoice) {
      info.BasedOn.PublicID = null
      info.BasedOn.TotalCostRPT.Amount = ZERO
      info.BasedOn.TotalPremiumRPT.Amount = ZERO
      replaceBasedOnGSTCost(info, Optional.empty())
    }
  }

  private function updateBasedOnValues(
      info : nz.co.acc.plm.integration.webservice.gxmodel.policyperiodmodel.PolicyPeriod,
      previousPeriod : PolicyPeriod) {
    final var fn = "updateBasedOnValues"

    if (StructuredLogger.INTEGRATION.DebugEnabled) {
      logDebug(fn, "Setting basedOn values from previousPeriodID=${previousPeriod.PublicID}")
    }

    info.BasedOn.TotalCostRPT.Amount = previousPeriod.TotalCostRPT.Amount
    info.BasedOn.TotalPremiumRPT.Amount = previousPeriod.TotalPremiumRPT.Amount
    info.BasedOn.PublicID = previousPeriod.PublicID

    replaceBasedOnGSTCost(info, Optional.of(previousPeriod))
  }

  private function isProvisional(policyPeriod : PolicyPeriod) : Boolean {
    return policyPeriod.isPolicyChange_ACC or policyPeriod.isRenewal_ACC or policyPeriod.isIssuance_ACC
  }

  private function replaceBasedOnGSTCost(
      data : nz.co.acc.plm.integration.webservice.gxmodel.policyperiodmodel.PolicyPeriod,
      basedOnPeriod : Optional<PolicyPeriod>) {

    // WPS
    if (data.CWPSLine != null) {

      // WPS GST can have two components

      // 1. Deductible GST
      var deductibleGstCostEntry = new PolicyPeriodGxModelUtil(data).getWpsDeductibleGstEntry()
      if (deductibleGstCostEntry != null) {
        var basedOnGst = basedOnPeriod.map(\pp -> new PolicyPeriodUtil(pp).getWpsDeductibleGst()).orElse(0.00bd)
        deductibleGstCostEntry.BasedOn.ActualAmountBilling.Amount = basedOnGst
      }

      // 2. Non Deductible GST - present for final only
      var nonDeductibleGstCostEntry = new PolicyPeriodGxModelUtil(data).getWpsNonDeductibleGstEntry()
      if (nonDeductibleGstCostEntry != null) {
        var basedOnGst = basedOnPeriod.map(\pp -> new PolicyPeriodUtil(pp).getWpsNonDeductibleGst()).orElse(0.00bd)
        nonDeductibleGstCostEntry.BasedOn.ActualAmountBilling.Amount = basedOnGst
      }
    }

    // WPC
    else if (data.EMPWPCLine != null) {
      var gstCostEntry = new PolicyPeriodGxModelUtil(data).getWpcGstEntry()
      if (gstCostEntry != null) {
        var basedOnGst = basedOnPeriod.map(\pp -> new PolicyPeriodUtil(pp).getWpcGst()).orElse(0.00bd)
        gstCostEntry.BasedOn.ActualAmountBilling.Amount = basedOnGst
      }
    }
    // CP/CPX
    else if (data.INDCoPLine != null) {

      var gstCostEntry = new PolicyPeriodGxModelUtil(data).getCpGstEntry()
      if (gstCostEntry != null) {
        var basedOnGst = basedOnPeriod.map(\pp -> new PolicyPeriodUtil(pp).getCpCpxGst()).orElse(0.00bd)
        gstCostEntry.BasedOn.ActualAmountBilling.Amount = basedOnGst
      }

      if (data.INDCPXLine != null) {
        var gstCostEntryCPX = new PolicyPeriodGxModelUtil(data).getCpxGstEntry()
        if (gstCostEntryCPX != null) {
          // Set CPX GST basedOn to 0, as the total CP/CPX GST is set in CP GST basedOn
          gstCostEntryCPX.BasedOn.ActualAmountBilling.Amount = ZERO
        }
      }
    }
    // AEP
    else if (data.AEPLine != null) {
      var gstCostEntry = new PolicyPeriodGxModelUtil(data).getAepGstEntry()
      if (gstCostEntry != null) {
        var basedOnGst = basedOnPeriod.map(\pp -> new PolicyPeriodUtil(pp).getAepGst()).orElse(0.00bd)
        gstCostEntry.BasedOn.ActualAmountBilling.Amount = basedOnGst
      }
    }
  }

  private function replaceLEwithActualLEForCP(data : nz.co.acc.plm.integration.webservice.gxmodel.policyperiodmodel.PolicyPeriod) {
    var entry = data.INDCoPLine.INDCoPCovs.Entry.first()
    entry.LiableEarningCov.TotalGrossIncome.Amount = entry.ActualLiableEarningsCov.TotalGrossIncome.Amount
    entry.LiableEarningCov.SelfEmployedNetIncome.Amount = entry.ActualLiableEarningsCov.SelfEmployedNetIncome.Amount
    entry.LiableEarningCov.TotalIncomeNotLiable.Amount = entry.ActualLiableEarningsCov.TotalIncomeNotLiable.Amount
    entry.LiableEarningCov.TotalLiableEarnings.Amount = entry.ActualLiableEarningsCov.TotalLiableEarnings.Amount
    if (FeatureToogleUtil.overseasIncomeEnabled()){
      entry.LiableEarningCov.TotalOverseasIncome.Amount = entry.ActualLiableEarningsCov.TotalOverseasIncome.Amount
    }
    entry.LiableEarningCov.TotalOtherExpensesClaimed.Amount = entry.ActualLiableEarningsCov.TotalOtherExpensesClaimed.Amount
    entry.LiableEarningCov.TotalShareholderEmplSalary.Amount = entry.ActualLiableEarningsCov.TotalShareholderEmplSalary.Amount
    entry.LiableEarningCov.NetSchedulerPayments.Amount = entry.ActualLiableEarningsCov.NetSchedulerPayments.Amount
    entry.LiableEarningCov.TotalActivePartnershipInc.Amount = entry.ActualLiableEarningsCov.TotalActivePartnershipInc.Amount
    entry.LiableEarningCov.AdjustedLTCIncome.Amount = entry.ActualLiableEarningsCov.AdjustedLTCIncome.Amount
    entry.LiableEarningCov.VariableAdjustmentDescription = entry.ActualLiableEarningsCov.VariableAdjustmentDescription
    entry.LiableEarningCov.AdjustedLiableEarnings.Amount = entry.ActualLiableEarningsCov.AdjustedLiableEarnings.Amount
    entry.LiableEarningCov.FullTime = entry.ActualLiableEarningsCov.FullTime
  }

  private function logInfo(fn : String, msg : String) {
    StructuredLogger.INTEGRATION.info(this + " " + fn + " " + msg)
  }

  private function logDebug(fn : String, msg : String) {
    StructuredLogger.INTEGRATION.debug(this + " " + fn + " " + msg)
  }

  private function logError(fn : String, msg : String) {
    StructuredLogger.INTEGRATION.error_ACC(this + " " + fn + " " + msg)
  }

  private function logError(fn : String, msg : String, e : Exception) {
    StructuredLogger.INTEGRATION.error_ACC( this + " " + fn + " " + msg , e)
  }

}
