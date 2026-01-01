package nz.co.acc.plm.integration.ir.exec.handler.actions.earningsupdate

uses gw.api.util.CurrencyUtil
uses gw.api.util.DisplayableException
uses gw.lang.reflect.ReflectUtil
uses gw.pl.persistence.core.Bundle

uses nz.co.acc.integration.util.IntegrationPolicyChangeUtil
uses nz.co.acc.lob.common.DateUtil_ACC
uses nz.co.acc.plm.integration.ir.exec.handler.IRPolicyNotFoundException
uses nz.co.acc.plm.integration.ir.exec.handler.actions.ActionsUtil
uses nz.co.acc.plm.integration.ir.util.IRAccountHelper
uses gw.surepath.suite.integration.logging.StructuredLogger
uses typekey.Currency

uses java.lang.invoke.MethodHandles
uses java.text.SimpleDateFormat

/**
 * Earnings Update Processing.
 * Extending classes must implement policy line specific behaviour.
 * <p>
 * Created by Swati Patel on 30/01/2017.
 */
abstract class EarningsUpdatePolicyActions {

  private static final var _log = StructuredLogger.INTEGRATION.withClass(MethodHandles.lookup().lookupClass())

  private var _premiumYear : Integer
  private var _balanceDate : String

  private var _defaultCurrency : Currency
  private var _finalAuditRequired : boolean
  private var _finalAuditPeriod : PolicyPeriod as readonly FinalAuditPeriod

  private var _bundle : Bundle as EarningsBundle
  private var _account : Account as readonly EarningsAccount
  private var _isRevision : boolean as readonly IsRevision
  private var _isAudit : boolean as readonly IsAudit
  private var _recordType = recordType()
  private var _multipleTargetsAllowed = checkMultipleTargetsAllowed()

  construct(premiumYear : Integer, balanceDate : String) {
    _premiumYear = premiumYear
    _balanceDate = balanceDate
    _defaultCurrency = CurrencyUtil.getDefaultCurrency()
  }

  property get defaultCurrency() : Currency {
    return _defaultCurrency
  }

  /**
   * Process earnings that come through in a CARA file.
   *
   * @param account - the account the earnings are for.
   * @param bundle  - the bundle
   */
  function processEarnings(account : Account, bundle : Bundle) {
    var fn = "processEarnings"
    _bundle = bundle
    _account = account

    _log.info("Processing earnings for account: ${account.ACCID_ACC} levyYear: ${_premiumYear} recordType: ${recordType()}")

    if (!isLevyYearValid(_premiumYear)) {
      throw new RuntimeException("Invalid levy year: " + _premiumYear)
    }

    _finalAuditRequired = finalAuditRequired()

    // Look for the targets to apply the earnings to.
    var policyPeriods = new IRAccountHelper(_account).findPolicyTargets_ACC(_premiumYear, _recordType, _bundle)

    // If no targets are found, we need to renew
    if (policyPeriods.Count == 0) {
      var policyPeriod = createRenewals(_premiumYear)
      // There is only one target - the renewal we just created.
      policyPeriods = {policyPeriod}
      // if final audit is required then target premium year + 1 is required to generate a levy
      if (_finalAuditRequired) {
        createRenewals(_premiumYear + 1)
      }
    } else {
      validateShareholdersCU(policyPeriods.first(), account)
    }

    var polChangeRequired = policyChangeRequired(policyPeriods.first())
    var hasAEPTargets = isLatestPeriodAEPMember(policyPeriods)

    // Make sure there's no unfinished work in progress
    IntegrationPolicyChangeUtil.assertNoOpenPolicyTransactions(policyPeriods)

    // Apply earnings to either a final audit, or a final audit revision.
    for (policyPeriod in policyPeriods) {
      if (!isLevyYearValidForPolicy(policyPeriod)) {
        throw new RuntimeException("Levy year is prior to submission. Cannot process acc number: ${_account.ACCID_ACC}")
      }
      if (_finalAuditRequired) {
        _isRevision = checkIfRevisionRequired(policyPeriod)
        if (not _isRevision) {
          _isAudit = true
          _finalAuditPeriod = policyPeriod
          doFinalAudit()
        } else {
          _isAudit = false
          doFinalAuditRevision(policyPeriod)
        }
      }
      _isAudit = false
    }

    // Now we need to update the earnings on the provisional targets
    if (_finalAuditRequired and polChangeRequired) {
      policyPeriods = new IRAccountHelper(_account).findPolicyTargets_ACC(_premiumYear + 1, _recordType, _bundle)

      if (policyPeriods.Count == 0) {
        //If we don't have provisional targets for AEP members, we don't apply provisionals...
        if (hasAEPTargets) {
          return
        }

        // If no targets are found for the next levy year, we need to renew
        var policyPeriod = createRenewals(_premiumYear + 1)
        policyPeriods = {policyPeriod}
      }
    }

    if (!_multipleTargetsAllowed && policyPeriods.Count > 1) {
      throw new RuntimeException("Multiple targets not allowed but got ${policyPeriods.Count} targets. Cannot process acc number: ${_account.ACCID_ACC}")
    }

    // Apply the policy change on each target
    // polChangeRequired = true for SelfEmployed since its implementing class does not override policyChangeRequired method
    // In SelfEmployed context the policy change is done on premium year
    // while in Employer/Shareholder context it would be premium year + 1 as policyPeriods is re-evaluated above
    if (polChangeRequired) {
      for (policyPeriod in policyPeriods) {
        doPolicyChange(policyPeriod, bundle)
      }
    }

    if (_balanceDate != null) {
      account = bundle.add(account)
      var balanceDate = _balanceDate + String.valueOf(_premiumYear)
      account.BalanceDate_ACC = new java.text.SimpleDateFormat('ddMMyyyy').parse(balanceDate)
    }
    //renewing up to current year
    createRenewals(Date.Now.LevyYear_ACC)
  }

  /**
   * Check if the latest period is AEP Member
   */
  private function isLatestPeriodAEPMember(periods : List<PolicyPeriod>) : boolean {
    if (!periods?.HasElements) {
      return false
    }
    var lastPeriod = periods.orderBy(\p -> p.PeriodEnd).last()
    return lastPeriod.Policy.Account.AEPContractAccount_ACC
  }

  protected function validateShareholdersCU(policyPeriod : PolicyPeriod, account : Account) {
    // overridden in ShareholderUpdateAction.gs
  }

  /**
   * The levy year should not be before where policy started
   *
   * @param policyPeriod
   * @return boolean
   */
  private function isLevyYearValidForPolicy(policyPeriod : PolicyPeriod) : boolean {
    var firstJob = policyPeriod.Policy.Periods.singleWhere(\pp -> {
      var theJob = pp.Job
      return theJob typeis Submission || theJob typeis RewriteNewAccount
    })

    if (DateUtil_ACC.nextACCLevyYearStart(firstJob.PeriodStart).YearOfDate > _premiumYear) {
      _log.error_ACC("Levy year: ${_premiumYear} is prior to the start date: ${firstJob.PeriodStart}")
      return false
    }
    return true
  }

  /**
   * Apply policy change to policy period passed through.
   *
   * @param policyPeriod - period to apply policy change to.
   * @param bundle       - existing bundle.
   */
  private function doPolicyChange(policyPeriod : PolicyPeriod, bundle : Bundle) {
    _log.info("doPolicyChange ${policyPeriod.PolicyNumber}")
    var policyChange : PolicyChange
    var newPeriod : PolicyPeriod

    policyPeriod = policyChangePreProcess(policyPeriod)

    policyChange = new PolicyChange(bundle)
    var effDate = policyPeriod.PeriodStart
    policyChange.startJob(policyPeriod.Policy, effDate)
    newPeriod = policyChange.Periods[0]
    ActionsUtil.setIRFlags(newPeriod.Job)

    createCoveragesForPolicyChange(newPeriod.Lines)

    newPeriod.PolicyChangeProcess.requestQuote()
    newPeriod.PolicyChangeProcess.issueJob(true)

    _log.info("Policy ${policyChange.Periods[0].PolicyNumber}, Job number: ${policyChange.JobNumber}, Display status: ${policyChange.DisplayStatus}")
    policyChangePostProcess(policyPeriod)
  }

  /**
   * Create renewals up to the premium year
   *
   * @return - the new policy period.
   */
  private function createRenewals(levyYear : int) : PolicyPeriod {
    // This call should give exactly one target back
    var renewalTargets = new IRAccountHelper(_account).findLatestPolicyForRenewal_ACC(_recordType)

    if (renewalTargets.Count > 1) {
      throw new RuntimeException("More than one target returned for renewal - cannot process any further.")
    }

    var target : PolicyPeriod

    if (renewalTargets.Count == 0) {
      throw new IRPolicyNotFoundException("The required policy does not exist on this account.")
    } else {
      target = renewalTargets.first()
    }
    if (target != null) {
      if (!isLevyYearValidForPolicy(target)) {
        throw new RuntimeException("Levy year ${levyYear} is prior to submission. Cannot process acc number: ${_account.ACCID_ACC}")
      }
      return createRenewals(target, levyYear)
    } else {
      throw new RuntimeException("Renewal target is null - cannot process any further.")
    }
  }

  /**
   * Create renewals up to the premium year and return the last policy.
   * The renewal might already be there - if so nothing is done.
   *
   * @param policy            - the policy to renew
   * @param targetPremiumYear - the premium year to create renewals up to.
   * @return - the new policy period
   */
  private function createRenewals(policyPeriod : PolicyPeriod, targetPremiumYear : int) : PolicyPeriod {
    var startYear = policyPeriod.LevyYear_ACC
    _log.info("Creating renewals from ${startYear} up to ${targetPremiumYear} for ${policyPeriod.PolicyNumber}")

    var renewal : Renewal
    while (policyPeriod.PeriodEnd.YearOfDate != targetPremiumYear) {
      renewal = doPolicyRenew(policyPeriod)
      policyPeriod = renewal.getLatestPeriod()
    }
    if (renewal != null) {
      return renewal.Policy.LatestBoundPeriod
    } else {
      _log.info("Renewal already exists for ${policyPeriod.PolicyNumber} ${targetPremiumYear}")
      return policyPeriod
    }
  }

  /**
   * Renew a policy.  In case extending classes need to renew, this is protected.
   *
   * @param policyNumber - the policy number of the policy to renew.
   * @return - the renewed policy.
   */
  protected function doPolicyRenew(period : PolicyPeriod) : Renewal {
    _log.info("Doing policy renewal for ${period.PolicyNumber}")
    var renewal = new Renewal(_bundle)

    ActionsUtil.setIRFlags(renewal)
    renewal.startJob(period.Policy)

    var policyPeriod = renewal.LatestPeriod
    var renewalProcess = policyPeriod.RenewalProcess

    //DE804 - renewal update rules not getting triggered
    ReflectUtil.invokeStaticMethod("rules.Renewal.RenewalAutoUpdate", "invoke", {policyPeriod})
    renewalProcess.requestQuote()
    renewalProcess.issueNow()

    _log.info("Policy ${period.PolicyNumber}, Job number: ${renewal.JobNumber}, Display status: ${renewal.DisplayStatus}")

    return renewal
  }

  /**
   * Check if a final audit is already there, and hence a revision will be required.
   *
   * @param policyPeriod - the policy period that requires an audit.
   * @return - true if a revision is required, false otherwise.
   */
  private function checkIfRevisionRequired(policyPeriod : PolicyPeriod) : boolean {
    return policyPeriod.Status == PolicyPeriodStatus.TC_AUDITCOMPLETE
  }

  /**
   * Find the last audit policy period.  Used when a revision is required to apply the revision on.
   *
   * @return - the policy period to revise.
   */
  private function findLastAuditPeriodForPolicy(policyPeriod : PolicyPeriod) : PolicyPeriod {
    var auditInformations = policyPeriod.AuditInformations

    var lastestAudit = auditInformations
        .where(\auditInfo -> auditInfo.IsComplete)
        .orderByDescending(\h -> h.Audit.PolicyPeriod.Job.CloseDate)
        .first()

    if (lastestAudit != null) {
      return lastestAudit.Audit.LatestPeriod
    }

    throw new RuntimeException("Audit record not found.")
  }

  /**
   * Do a final audit on the finalAuditPeriod
   */
  private function doFinalAudit() {
    _log.info("Doing final audit for ${_finalAuditPeriod.PolicyNumber}")
    var auditInformation = _finalAuditPeriod.AuditInformations.orderByDescending(\h -> h.CreateTime).first()

    if (auditInformation == null or auditInformation.IsWaived) {
      _finalAuditPeriod = _bundle.add(_finalAuditPeriod)

      var periodEnd = _finalAuditPeriod.PeriodEnd
      var periodStart = _finalAuditPeriod.PeriodStart
      // Set the due date 1 month after initDate
      // GW article # 000031290
      // OOTB example gw/job/audit/AuditScheduler.gs:96
      var dueDate = periodStart.addMonths(1)
      gw.job.audit.AuditScheduler.scheduleNewAudit(_finalAuditPeriod, periodStart, periodEnd, periodStart, dueDate,
          AuditScheduleType.TC_FINALAUDIT, AuditMethod.TC_IRFEED_ACC, false)

      auditInformation = _finalAuditPeriod.AuditInformations.last()
    }
    auditInformation = _bundle.add(auditInformation)
    auditInformation.withdrawUnboundPolicyChanges()
    auditInformation.startAuditJob()
    setAuditMethod(auditInformation)
    auditInformation.ReceivedDate = Date.CurrentDate
    ActionsUtil.setIRFlags(auditInformation.Audit)
    updateCoveragesForFinalAudit(auditInformation)
    finalAuditQuoteAndComplete(auditInformation)
  }

  private function setAuditMethod(auditInformation : AuditInformation) {
    auditInformation.AuditMethod = AuditMethod.TC_IRFEED_ACC
    auditInformation.ActualAuditMethod = AuditMethod.TC_IRFEED_ACC
  }

  /**
   * Do a final audit revision after finding the correct audit period to revise.
   *
   * @param policyPeriod - find the last audit record based on the audit information of this policy peiod.
   */
  private function doFinalAuditRevision(policyPeriod : PolicyPeriod) {
    _log.info("Doing final audit revision for ${policyPeriod.PolicyNumber}")
    var period = findLastAuditPeriodForPolicy(policyPeriod)
    period = _bundle.add(period)

    var audit = period.Audit

    period = audit.revise()
    ActionsUtil.setIRFlags(period.Job)

    var auditInformation = (period.Job as Audit).AuditInformation
    setAuditMethod(auditInformation)
    auditInformation.ReceivedDate = Date.CurrentDate
    auditInformation = _bundle.add(auditInformation)

    updateCoveragesForFinalAudit(auditInformation)

    finalAuditQuoteAndComplete(auditInformation)
  }

  /**
   * Quote and complete a final audit.
   *
   * @param auditInformation - the AuditInformation associated with the period.
   */
  private function finalAuditQuoteAndComplete(auditInformation : AuditInformation) {
    var auditProcess = auditInformation.Audit.LatestPeriod.AuditProcess

    if (auditProcess.canRequestQuote().Okay) {
      auditProcess.requestQuote()
    }

    auditProcess.complete()
  }

  private function isLevyYearValid(levyYear : int) : boolean {
    return DateUtil_ACC.nextACCLevyYearStart(Date.CurrentDate).YearOfDate - levyYear <= getMaxYearsInPast()
  }

  protected function policyChangePostProcess(policyPeriod : PolicyPeriod) {
    return
  }

  protected function policyChangePreProcess(policyPeriod : PolicyPeriod) : PolicyPeriod {
    return policyPeriod
  }

  /**
   * Implementing classes can choose to override this if they do not allow multiple targets.
   * Defaults to true.
   *
   * @return - defaults to true.
   */
  protected function checkMultipleTargetsAllowed() : boolean {
    return true
  }

  /**
   * Implementing classes can choose to override this if they support final audits
   *
   * @return - true if final audit is supported
   */
  protected function finalAuditRequired() : boolean {
    return false
  }

  /**
   * Implementing classes can choose to override this if they need to control whether to create a policy change
   *
   * @return - true if provisional is required
   */
  protected function policyChangeRequired(policyPeriod : PolicyPeriod) : boolean {
    return true
  }

  /**
   * Implementing classes override this if they support final audits to apply earnings.
   *
   * @param auditInfo - the AuditInformation object to update
   * @param period    - the period to update.
   */
  protected function updateCoveragesForFinalAudit(auditInfo : AuditInformation) {
    throw new RuntimeException("Final Audit not handled.")
  }

  /**
   * Extending classes must implement this action specific method.
   *
   * @param levyYear
   * @return
   */
  abstract protected function getMaxYearsInPast() : int

  /**
   * Extending classes must implement this action specific method.
   *
   * @param line
   * @param bundle
   */
  abstract protected function recordType() : IRExtRecordType_ACC

  /**
   * Extending classes must implement this policy line specific method.
   *
   * @param line
   * @param bundle
   */
  abstract protected function createCoveragesForPolicyChange(lines : entity.PolicyLine[])

  /**
   * Extending classes must implement this to return their policy line typekey.
   *
   * @param line
   * @param bundle
   */
  abstract protected function getPolicyLineType() : typekey.PolicyLine
}
