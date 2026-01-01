package nz.co.acc.integration.instruction.handler

uses entity.Job
uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.api.util.DisplayableException
uses gw.job.AuditProcess
uses gw.job.PolicyChangeProcess
uses gw.pl.persistence.core.Bundle

uses nz.co.acc.integration.instruction.handler.exception.PolicyNotFoundException
uses nz.co.acc.integration.util.IntegrationPolicyChangeUtil
uses nz.co.acc.plm.integration.instruction.util.InstructionConstantHelper
uses nz.co.acc.plm.integration.ir.util.ConstantPropertyHelper
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.util.finder.FinderUtil_ACC

/**
 * The base class for all the handlers
 */
class InstructionRecordHandlerUtil {
  var _instructionType : InstructionType_ACC
  static var _log = StructuredLogger.INTEGRATION.withClass(InstructionRecordHandlerUtil)

  public construct(instructionType : InstructionType_ACC) {
    _instructionType = instructionType
  }

  public static final var _productCodeMap : HashMap<String, String> = {
      InstructionConstantHelper.PRODUCTKEY_WPC -> ConstantPropertyHelper.PRODUCTCODE_WPC,
      InstructionConstantHelper.PRODUCTKEY_WPS -> ConstantPropertyHelper.PRODUCTCODE_WPS,
      InstructionConstantHelper.PRODUCTKEY_CP -> ConstantPropertyHelper.PRODUCTCODE_CP
  }

  /**
   * Set all job flags for bulk update
   *
   * @param theJob
   */
  function setJobFlags(theJob : Job) {
    theJob.setTriggerReason_ACC(getReasonCode())
    theJob.InternalJob_ACC = true
  }

  /**
   * JUNO-4025 function to check if the Instruction Record status can be retried from UI
   */
  public static function isRetryableStatus(status : InstructionRecordStatus_ACC) : Boolean {
    return status == InstructionRecordStatus_ACC.TC_ERROR
  }

  /**
   * Get the reason code for this instruction.
   *
   * @return
   */
  public function getReasonCode() : ReasonCode {
    return _instructionType.deriveReasonCode()
  }

  /**
   * do policy change
   *
   * @param bundle The given Bundle
   */
  function doPolicyChange(policyNumber : String, effDate : Date, bundle : Bundle) {
    var policy = findPolicyByPolicyNumberIfCan(policyNumber)
    policy.cleanUpInternalJobs_ACC(bundle, getReasonCode())
    var policyChange = new PolicyChange(bundle)
    setJobFlags(policyChange)
    policyChange.startJob(policy, effDate)

    var newPeriod = policyChange.LatestPeriod
    var theProcess = newPeriod.PolicyChangeProcess

    completePolicyChange(theProcess, newPeriod)
  }

  /**
   * Quote and Complete Audit
   */
  public function completePolicyChange(process : PolicyChangeProcess, latest : PolicyPeriod) {
    latest.recalculateLiableEarnings()
    if (process.canRequestQuote().Okay) {
      process.requestQuote()
    }

    if (process.canBind().Okay && process.canIssue().Okay) {
      process.issueJob(true)
    }
  }

  /**
   * do policy change
   *
   * @param bundle The given Bundle
   */
  public function doAudit(policyTerm : PolicyTerm, bundle : Bundle) {
    var latest = bundle.add(policyTerm).findLatestBoundOrAuditedPeriod_ACC()
    var levyYear = latest.LevyYear_ACC
    var policyNumber = latest.PolicyNumber

    latest.Policy.cleanUpInternalJobs_ACC(bundle, getReasonCode())
    IntegrationPolicyChangeUtil.assertNoOpenPolicyTransactions(latest)

    if (latest.Audit == null) {
      //do Audit
      _log.info("Doing audit for policyNumber=${policyNumber}, levyYear=${levyYear}")
      var auditInformations = latest.AuditInformations
      if (auditInformations == null || !auditInformations.HasElements) {
        throw new DisplayableException("Can't find the AuditInformation for LevyYear[${levyYear}]!")
      }
      var auditInformation = latest.AuditInformations[0]
      auditInformation = bundle.add(auditInformation)

      auditInformation.withdrawUnboundPolicyChanges()
      auditInformation.startAuditJob()
      auditInformation.AuditMethod = AuditMethod.TC_MANUAL_ACC
      auditInformation.ReceivedDate = Date.CurrentDate

      var job = auditInformation.Audit
      setJobFlags(job)

      var newPeriod = job.LatestPeriod

      var auditProcess = newPeriod.AuditProcess

      completeAudit(auditProcess, newPeriod)
    } else {
      //do revise Audit
      _log.info("Doing audit revision for policyNumber=${policyNumber}, levyYear=${levyYear}")
      var editablePeriod = bundle.add(latest)
      var newPeriod = editablePeriod.Audit.revise()

      var auditJob = newPeriod.Audit
      setJobFlags(auditJob)

      var auditInformation = auditJob.AuditInformation

      auditInformation.AuditMethod = AuditMethod.TC_MANUAL_ACC
      auditInformation.ReceivedDate = Date.CurrentDate

      var auditProcess = newPeriod.AuditProcess

      completeAudit(auditProcess, newPeriod)
    }
  }

  /**
   * Quote and Complete Audit
   */
  public function completeAudit(process : AuditProcess, latest : PolicyPeriod) {
    latest.recalculateLiableEarnings()
    if (process.canRequestQuote().Okay) {
      process.requestQuote()
    }
    if (process.canComplete().Okay) {
      process.complete()
    }
  }

  /**
   * Find the policy by policyNumber, if can't throw a DisplayableException...
   */
  public function findPolicyByPolicyNumberIfCan(policyNumber : String) : Policy {
    var policy = Policy.finder.findPolicyByPolicyNumber(policyNumber)
    if (policy == null) {
      throw new DisplayableException("Can't find Policy by PolicyNumber[${policyNumber}]!")
    }
    return policy
  }

  /**
   * USE API to get PolicyPeriod target
   */
  public function findPolicyPeriodTargets(accNum : String, productKey : String, levyYear : Integer) : List<PolicyPeriod> {
    var productCode = _productCodeMap.get(productKey)
    if (productCode == null) {
      productCode = productKey
    }

    return FinderUtil_ACC
        .findPolicyTerms(accNum, productCode, levyYear)
        .map(\pt -> pt.findLatestBoundOrAuditedPeriod_ACC())
        .where(\pp -> pp != null and pp.PeriodStart != pp.CancellationDate)
        .toList()
  }

  /**
   * USE API to get PolicyPeriod target for renewal records
   */
  public function findPolicyPeriodTargetsForRenewals(accNum : String, productKey : String, levyYear : Integer) : PolicyPeriod[] {
    var productCode = _productCodeMap.get(productKey)
    if (productCode == null) {
      productCode = productKey
    }

    var periods = Query.make(PolicyPeriod)
        .compare(PolicyPeriod#ACCPolicyID_ACC, Equals, accNum + productKey)
        .compare(PolicyPeriod#LevyYear_ACC, Equals, levyYear)
        .compare(PolicyPeriod#Status, Equals, PolicyPeriodStatus.TC_RENEWING)
        .select()
        .toTypedArray()

    if (periods == null or !periods.HasElements) {
      throw new PolicyNotFoundException(accNum, productKey, levyYear, PolicyPeriodStatus.TC_RENEWING)
    }

    return periods
  }

  public static function findAccount(accID : String) : Account {
    var account = Query.make(Account)
        .compare(Account#ACCID_ACC, Relop.Equals, accID)
        .select()
        .FirstResult
    if (account == null) {
      throw new RuntimeException("Account not found with ACCID ${accID}")
    }
    return account
  }

  public static function findMostRecentPolicyTerm(accNum : String, productKey : String) : PolicyPeriod {
    var productCode = _productCodeMap.get(productKey)
    if (productCode == null) {
      productCode = productKey
    }

    return FinderUtil_ACC
        .findLatestPolicyTerm(accNum, productCode)
        .findLatestBoundOrAuditedPeriod_ACC()
  }

}