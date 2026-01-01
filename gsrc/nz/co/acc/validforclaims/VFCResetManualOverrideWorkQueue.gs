package nz.co.acc.validforclaims

uses com.google.common.base.Preconditions
uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.processes.WorkQueueBase
uses gw.surepath.suite.integration.logging.StructuredLogger

/**
 * 1. Reverts VFC manual overrides back to business rules setting after a configurable number of days.
 * 2. Updates VFC flag for policy terms where VFCUpdatePending_ACC = true
 */
class VFCResetManualOverrideWorkQueue extends WorkQueueBase<PolicyTerm, StandardWorkItem> {
  private static var LOG = StructuredLogger.CONFIG.withClass(VFCResetManualOverrideWorkQueue)

  construct() {
    super(BatchProcessType.TC_VFCRESETMANUALOVERRIDE_ACC, StandardWorkItem, PolicyTerm)
  }

  override function findTargets() : Iterator<PolicyTerm> {
    var vfcManualOverrideStartDate = Date.Today.addDays(-1 * ScriptParameters.VFCManualOverrideExpiryDays_ACC)
    LOG.info("Finding PolicyTerms to process. vfcManualOverrideStartDate=${vfcManualOverrideStartDate.toISODate()}")

    var ptQuery = Query.make(PolicyTerm)
        .or(\orCriteria -> {
          orCriteria.compare(PolicyTerm#VFCUpdatePending_ACC, Relop.Equals, true)
          orCriteria.and(\andCriteria -> {
            andCriteria.compare(PolicyTerm#VFCUpdatePending_ACC, Relop.Equals, false)
            andCriteria.compare(PolicyTerm#VFCOverrideDate_ACC, Relop.NotEquals, null)
            andCriteria.compare(PolicyTerm#VFCOverrideDate_ACC, Relop.LessThan, vfcManualOverrideStartDate)
          })
        })
        .withLogSQL(true)
        .withDistinct(true)
    var results = ptQuery.select()
    results.setPageSize(10000)
    return results.iterator()
  }

  override function processWorkItem(workItem : StandardWorkItem) {
    var policyTerm = extractTarget(workItem)
    var policyPeriod = policyTerm.findLatestBoundOrAuditedPeriod_ACC()
    var newVFCFlag = false

    if (policyPeriod == null) {
      LOG.info("Latest bound/audited period is null for PolicyTerm ${policyTerm.PublicID} for account ${policyTerm.Policy.Account.ACCID_ACC} on year ${policyTerm.AEPFinancialYear_ACC}}. Setting VFC to false")
      newVFCFlag = false
    } else {
      policyPeriod = policyPeriod.getSliceAtEffectiveDate_ACC()
      newVFCFlag = ValidForClaimsUtil.isPolicyTermVFC(policyPeriod)
      LOG.info("Processing PolicyTerm ${policyTerm.PublicID} - ${policyTerm.AEPProductCode_ACC} - ${policyTerm.AEPFinancialYear_ACC} on Account ${policyTerm.Policy.Account.ACCID_ACC} : ValidForClaimsReg_ACC=${newVFCFlag}")
    }
    try {
      gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
        policyTerm = bundle.add(policyTerm)
        policyTerm.ValidForClaimsReg_ACC = newVFCFlag
        policyTerm.VFCOverrideDate_ACC = null
        policyTerm.VFCUpdatePending_ACC = false
      })
    } catch (e : Exception) {
      LOG.error_ACC("Failed to update PolicyTerm ${policyTerm.PublicID} on Account ${policyTerm.Policy.Account.ACCID_ACC}", e)
      throw e
    }
  }

}
