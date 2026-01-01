package nz.co.acc.workqueue.datafix

uses gw.api.database.Query
uses gw.api.database.QuerySelectColumns
uses gw.api.path.Paths
uses gw.processes.WorkQueueBase
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.integration.junoinformationservice.client.JunoInfoServiceClient
uses nz.co.acc.integration.junoinformationservice.messaging.JISMessageEvents
uses nz.co.acc.plm.integration.ir.util.ConstantPropertyHelper


class VFCSyncWorkQueue extends WorkQueueBase<Account, StandardWorkItem> {
  private final var LOG = StructuredLogger.CONFIG.withClass(this)
  private final var PAGE_SIZE = 100000

  construct() {
    super(BatchProcessType.TC_VFCSYNC_ACC, StandardWorkItem, Account)
  }

  override function findTargets() : Iterator<Account> {
    LOG.info("Selecting all accounts...")
    var query = Query.make(Account).select()
    query.setPageSize(PAGE_SIZE)
    return query.iterator()
  }

  override function processWorkItem(workItem : StandardWorkItem) {
    var account = extractTarget(workItem)
    processAccount(account)
  }

  public function processAccount(account : Account) {
    if (account.AEPContractAccount_ACC) {
      // Only a few of these accounts. Just send the update
      sendAccountChangeToEos(account)
      return
    }

    var wpcPeriod = findLatestPolicyPeriod(account.ACCID_ACC, ConstantPropertyHelper.PRODUCTCODE_WPC)
    var wpsPeriod = findLatestPolicyPeriod(account.ACCID_ACC, ConstantPropertyHelper.PRODUCTCODE_WPS)
    var cpPeriod = findLatestPolicyPeriod(account.ACCID_ACC, ConstantPropertyHelper.PRODUCTCODE_CP)

    if (isVFCChanged(wpcPeriod) or isVFCChanged(wpsPeriod) or isVFCChanged(cpPeriod)) {
      sendAccountChangeToEos(account)
    }
  }

  public function sendAccountChangeToEos(account : Account) {
    LOG.info("Sync ${account.ACCID_ACC}")
    JunoInfoServiceClient.INSTANCE.update(account, true)
  }

  public function isVFCChanged(optionalPeriod : Optional<PolicyPeriod>) : boolean {
    if (optionalPeriod.Empty) {
      return false
    } else {
      var period = optionalPeriod.get()
      return period.ValidForClaimsReg_ACC != period.PolicyTerm.ValidForClaimsReg_ACC
    }
  }

  public function findLatestPolicyPeriod(accID : String, productCode : String) : Optional<PolicyPeriod> {
    var query = Query.make(PolicyTerm)
    query.compare(PolicyTerm#AEPACCNumber_ACC, Equals, accID)
    query.compare(PolicyTerm#AEPProductCode_ACC, Equals, productCode)
    query.compare(PolicyTerm#MostRecentTerm, Equals, true)

    var orderByLevyYear = QuerySelectColumns.path(Paths.make(PolicyTerm#AEPFinancialYear_ACC))
    var orderByCreateTime = QuerySelectColumns.path(Paths.make(PolicyTerm#CreateTime))

    var mostRecentPolicyTerm = query.select()
        .orderByDescending(orderByLevyYear)
        .thenByDescending(orderByCreateTime)
        .FirstResult

    if (mostRecentPolicyTerm != null) {
      return Optional.of(mostRecentPolicyTerm.findLatestBoundOrAuditedPeriod_ACC())
    } else {
      return Optional.empty()
    }
  }

}