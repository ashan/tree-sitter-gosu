package nz.co.acc.integration.junoinformationservice.workqueue

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.processes.WorkQueueBase


uses nz.co.acc.constants.ProductCode
uses nz.co.acc.integration.junoinformationservice.client.JunoInfoServiceClient
uses nz.co.acc.plm.common.configurationservice.ConfigurationProperty
uses gw.surepath.suite.integration.logging.StructuredLogger

/**
 * Reload records into JIS / Cosmos DB
 */
@Export
class JunoInfoServiceBulkLoader extends WorkQueueBase<Account, StandardWorkItem> {
  private static final var _log = StructuredLogger.INTEGRATION.withClass(JunoInfoServiceBulkLoader)
  private final var PAGE_SIZE = 100000

  construct() {
    super(BatchProcessType.TC_JISBULKLOADERWORKQUEUE_ACC, StandardWorkItem, Account)
  }

  override function findTargets() : Iterator<Account> {
    if (not ConfigurationProperty.JIS_ENABLED.PropertyValue.toBoolean()) {
      _log.info("Juno Information Service is disabled in configuration.properties")
      return new LinkedList<Account>().iterator();
    }
    _log.info("Selecting accounts...")
    var query = Query.make(Account).withLogSQL(true)
    if (ScriptParameters.JunoInformationServiceBulkLoadSelectAEPContractOnly_ACC) {
      query.compare(Account#AEPContractAccount_ACC, Relop.Equals, true)
    }
    var result = query.select()
    result.setPageSize(PAGE_SIZE)
    return result.iterator()
  }

  override function processWorkItem(standardWorkItem : StandardWorkItem) {
    var account = extractTarget(standardWorkItem)
    processAccount(account)
  }

  public function processAccount(account : Account) {
    _log.info("ACCID: ${account.ACCID_ACC}")
    if (ScriptParameters.JunoInformationServiceBulkLoadAccounts_ACC) {
      JunoInfoServiceClient.INSTANCE.update(account, false)
    }
    if (isPolicyTermSyncEnabled()) {
      for (policy in account.Policies) {
        if (isPolicyTermSyncEnabled(policy.ProductCode_ACC)) {
          for (policyPeriod in policy.PolicyTermFinder_ACC.latestPeriodPerPolicyTerm()) {
            if(_log.DebugEnabled){
              _log.debug("ACCID: ${account.ACCID_ACC}, Period: ${policyPeriod.JunoInfoServiceDisplayName_ACC}")
            }
            JunoInfoServiceClient.INSTANCE.update(policyPeriod, false)
          }
        }
      }
    }
    if (ScriptParameters.JunoInformationServiceBulkLoadDocuments_ACC) {
      for (document in account.Documents) {
        _log.debug("ACCID: ${account.ACCID_ACC}, Document: ${document.PublicID}")
        JunoInfoServiceClient.INSTANCE.update(document, false)
      }
    }
  }

  private function isPolicyTermSyncEnabled() : Boolean {
    return ScriptParameters.JunoInformationServiceBulkLoadPolicyTermsAEP_ACC
        or ScriptParameters.JunoInformationServiceBulkLoadPolicyTermsCPCPX_ACC
        or ScriptParameters.JunoInformationServiceBulkLoadPolicyTermsWPC_ACC
        or ScriptParameters.JunoInformationServiceBulkLoadPolicyTermsWPS_ACC
  }

  private function isPolicyTermSyncEnabled(productCode : ProductCode) : Boolean {
    switch (productCode) {
      case AccreditedEmployersProgramme:
        return ScriptParameters.JunoInformationServiceBulkLoadPolicyTermsAEP_ACC
      case EmployerACC:
        return ScriptParameters.JunoInformationServiceBulkLoadPolicyTermsWPC_ACC
      case IndividualACC:
        return ScriptParameters.JunoInformationServiceBulkLoadPolicyTermsCPCPX_ACC
      case ShareholdingCompany:
        return ScriptParameters.JunoInformationServiceBulkLoadPolicyTermsWPS_ACC
      default:
        return true
    }
  }

}