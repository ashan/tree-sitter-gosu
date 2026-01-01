package nz.co.acc.workqueue.datafix

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.processes.WorkQueueBase
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.validforclaims.ValidForClaimsUtil

/**
 * Updates VFC flag for policy terms where VFCUpdatePending_ACC = true
 * Run on first deployment to initialize all VFC flags when the feature is released
 */
class VFCWorkQueue extends WorkQueueBase<Account, StandardWorkItem> {
  private static var LOG = StructuredLogger.CONFIG.withClass(VFCWorkQueue)
  private final var PAGE_SIZE = 100000

  construct() {
    super(BatchProcessType.TC_VFC_ACC, StandardWorkItem, Account)
  }

  override function findTargets() : Iterator<Account> {
    LOG.info("Selecting all accounts...")
    var query = Query.make(Account).select()
    query.setPageSize(PAGE_SIZE)
    return query.iterator()
  }

  override function processWorkItem(workItem : StandardWorkItem) {
    var account = extractTarget(workItem)
    var policyTerms = findPolicyTerms(account)

    LOG.info("Processing ${policyTerms.Count} policy terms for account ${account}")

    for (policyTerm in policyTerms) {
      processPolicyTerm(policyTerm)
    }
  }

  private function findPolicyTerms(account : Account) : List<PolicyTerm> {
    return Query.make(PolicyTerm)
        .compare(PolicyTerm#VFCUpdatePending_ACC, Relop.Equals, true)
        .join(PolicyTerm#Policy)
        .compare(Policy#Account, Relop.Equals, account)
        .withLogSQL(true)
        .withDistinct(true)
        .select()
        .toList()
  }

  private function processPolicyTerm(policyTerm : PolicyTerm) {
    var policyPeriod = policyTerm.findLatestBoundOrAuditedPeriod_ACC()
    var newVFCFlag = false

    if (policyPeriod == null) {
      LOG.info("Latest bound/audited period is null for PolicyTerm ${policyTerm.PublicID}")
      newVFCFlag = false
    } else {
      policyPeriod = policyPeriod.getSliceAtEffectiveDate_ACC()
      newVFCFlag = ValidForClaimsUtil.isPolicyTermVFC(policyPeriod)
    }

    LOG.info("Processing PolicyTerm ${policyTerm.PublicID} - ${policyTerm.AEPProductCode_ACC} - ${policyTerm.AEPFinancialYear_ACC} on Account ${policyTerm.Policy.Account.ACCID_ACC} : ValidForClaimsReg_ACC=${newVFCFlag}")
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
