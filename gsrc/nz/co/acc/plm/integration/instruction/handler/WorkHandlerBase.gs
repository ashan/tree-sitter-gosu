package nz.co.acc.plm.integration.instruction.handler

uses entity.BusinessIndustryCode_ACC
uses entity.Job
uses gw.api.database.Query
uses gw.api.util.CurrencyUtil
uses gw.api.util.DisplayableException
uses gw.job.AuditProcess
uses gw.job.PolicyChangeProcess
uses gw.pl.currency.MonetaryAmount
uses gw.pl.persistence.core.Bundle
uses gw.surepath.suite.integration.logging.StructuredLogger
uses gw.util.GosuStringUtil
uses nz.co.acc.integration.ir.record.util.InboundRecordStatusUtil
uses nz.co.acc.plm.integration.instruction.handler.error.BlockedByUnprocessedIRRecordsException
uses nz.co.acc.plm.integration.instruction.util.InstructionConstantHelper
uses nz.co.acc.plm.integration.ir.util.ConstantPropertyHelper

uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.util.finder.FinderUtil_ACC

uses java.math.BigDecimal

/**
 * The base class for all the handlers
 */
abstract class WorkHandlerBase implements WorkHandler {
  private var _worker : InstructionWorker_ACC
  protected var _policyNumber : String
  protected var _effDate : Date

  protected var _productCodeMap : HashMap<String, String> = {
      InstructionConstantHelper.PRODUCTKEY_WPC->ConstantPropertyHelper.PRODUCTCODE_WPC,
      InstructionConstantHelper.PRODUCTKEY_WPS->ConstantPropertyHelper.PRODUCTCODE_WPS,
      InstructionConstantHelper.PRODUCTKEY_CP->ConstantPropertyHelper.PRODUCTCODE_CP
  }

  /**
   * Default implementation for Worker Getter
   *
   * @return
   */
  override public property get InstructionWorker() : InstructionWorker_ACC {
    return _worker
  }

  /**
   * Default implementation for Worker Setter
   *
   * @return
   */
  override public property set InstructionWorker(worker : InstructionWorker_ACC) {
    _worker = worker
  }

  /**
   * Is the context valid for doWork function
   *
   * @param InstructionWorker
   */
  override public function isValidContext() : boolean {
    if (_worker.Completed) {
      // the workflow deosn't need to continue, the transaction is finished.
      return false
    }
    var sequencer = _worker.IRSequencer_ACC
    if (!sequencer.IsActive) {
      throw new DisplayableException("The sequencer[${sequencer.SequencerKey}] is not active!")
    }

    var inboundRecordStatusUtil = new InboundRecordStatusUtil()
    if (inboundRecordStatusUtil.hasUnprocessedRecords(sequencer.SequencerKey)) {
      throw new BlockedByUnprocessedIRRecordsException("Unprocessed inbound IR records exist for account [${sequencer.SequencerKey}]. Cannot proceed.")
    }

    return true
  }

  /**
   * Set all job flags for bulk update
   *
   * @param theJob
   */
  protected function setJobFlags(theJob : Job) {
    theJob.setTriggerReason_ACC(getReasonCode())
    theJob.InternalJob_ACC = true
  }

  /**
   * Get the reason code for this instruction.
   *
   * @return
   */
  protected function getReasonCode() : ReasonCode {
    return this.InstructionWorker.Instruction_ACC.InstructionType_ACC.deriveReasonCode()
  }

  /**
   * do policy change
   *
   * @param bundle The given Bundle
   */
  protected function doPolicyChange(policyNumber : String, effDate : Date, bundle : Bundle) {
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
  protected function completePolicyChange(process : PolicyChangeProcess, latest : PolicyPeriod) {
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
  protected function doAudit(policyNumber : String, levyYear : Integer, bundle : Bundle) {
    var fn = "doAudit"
    var policy = findPolicyByPolicyNumberIfCan(policyNumber)

    if (policy == null) {
      throw new DisplayableException("Can't find the Policy to do Audit!")
    }
    policy.cleanUpInternalJobs_ACC(bundle, getReasonCode())
    var ppQ = Query.make(PolicyPeriod)
        .compare(PolicyPeriod#Policy, Equals, policy)
        .compare(PolicyPeriod#LevyYear_ACC, Equals, levyYear)
        .compareIn(PolicyPeriod#Status, {PolicyPeriodStatus.TC_BOUND, PolicyPeriodStatus.TC_AUDITCOMPLETE})
    var ppList = ppQ.select()

    if (!ppList.HasElements) {
      throw new DisplayableException("Can't find the Policy to do Audit for LevyYear[${levyYear}]!")
    }
    var latest = ppList.toList().orderBy(\pp -> pp.PeriodEnd)
        .thenBy(\pp -> pp.CreateTime)
        .thenBy(\pp -> pp.UpdateTime).last()

    if (latest.Audit == null) {
      //do Audit
      StructuredLogger.INTEGRATION.info(this + " " + fn + " " + "Do an Audit Job!")
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
      StructuredLogger.INTEGRATION.info(this + " " + fn + " " + "Do an Audit Revision Job!")
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
  protected function completeAudit(process : AuditProcess, latest : PolicyPeriod) {
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
  protected function findPolicyByPolicyNumberIfCan(policyNumber : String) : Policy {
    var policy = Policy.finder.findPolicyByPolicyNumber(policyNumber)
    if (policy == null) {
      throw new DisplayableException("Can't find Policy by PolicyNumber[${policyNumber}]!")
    }
    return policy
  }

  /**
   * Load the Parameters.
   * <p>
   * The expected value is "[PolicyNumber],[EffDate]"
   */
  protected function loadPolicyNumberAndEffDate(params : String) {
    var values : String[]
    if (params != null) {
      values = params.split(InstructionConstantHelper.CSV_DELIMITER)
    }
    if (values == null || values.length != 2) {
      throw new DisplayableException("Parameters[${InstructionWorker.Parameters}] is not valid!")
    }
    _policyNumber = values[0]
    var dateValue = values[1]
    if (dateValue.length == InstructionConstantHelper.DATE_FORMAT_PATTERN_yMd.length) {
      _effDate = InstructionConstantHelper.DATE_FORMAT_yMd.parse(dateValue)
    } else {
      _effDate = InstructionConstantHelper.DATE_FORMAT_dMYHm.parse(dateValue)
    }

    if (values[1].length == InstructionConstantHelper.DATE_FORMAT_PATTERN_dMYHm.length)
      _effDate = InstructionConstantHelper.DATE_FORMAT_dMYHm.parse(values[1])
    else
      _effDate = InstructionConstantHelper.DATE_FORMAT_yMd.parse(values[1])
  }

  /**
   * If can not find only one BusinessIndustryCode_ACC or can find multi BusinessIndustryCode_ACC return null.
   * Otherwise return valid BusinessIndustryCode_ACC
   *
   * @param bicCode
   * @param levyYear
   * @return BusinessIndustryCode_ACC
   */
  public function findBusinessIndustryCode(bicCode : String, levyYear : Integer) : BusinessIndustryCode_ACC {
    var query = Query.make(BusinessIndustryCode_ACC)
    var list = query.compare(BusinessIndustryCode_ACC#BusinessIndustryCode, Equals, bicCode)
        .select()
    if (list == null || list.Count == 0) {
      return null
    }
    var validCodes = list.where(\c -> c.EndDate.YearOfDate == levyYear)

    if (validCodes == null || validCodes.Count != 1) {
      return null
    } else {
      return validCodes.first()
    }
  }

  /**
   * USE API to get PolicyPeriod target
   */
  protected function findPolicyPeriodTargets(accNum : String, productKey : String, levyYear : Integer) : PolicyPeriod[] {
    var productCode = _productCodeMap.get(productKey)
    if (productCode == null) {
      productCode = productKey
    }

    return FinderUtil_ACC
        .findPolicyTerms(accNum, productCode, levyYear)
        .map(\pt -> pt.findLatestBoundOrAuditedPeriod_ACC())
        .where(\pp -> pp != null and pp.PeriodStart != pp.CancellationDate)
  }

  /**
   * USE API to get PolicyPeriod target for renewal records
   */
  protected function findPolicyPeriodTargetsForRenewals(accNum : String, productKey : String, levyYear : Integer) : PolicyPeriod[] {
    var productCode = _productCodeMap.get(productKey)
    if (productCode == null) {
      productCode = productKey
    }

    var query = Query.make(PolicyPeriod)
    query.compare(PolicyPeriod#ACCPolicyID_ACC, Equals, accNum + productKey)
    query.compare(PolicyPeriod#LevyYear_ACC, Equals, levyYear)
    query.compare(PolicyPeriod#Status, Equals, PolicyPeriodStatus.TC_RENEWING)

    var validPeriods = query.select().toList()

    if (validPeriods == null || !validPeriods.HasElements) {
      throw new DisplayableException("Can't find policy to update!")
    }

    var targets = new ArrayList<PolicyPeriod>()

    validPeriods.each(\pp -> {
      targets.add(pp)
    })

    return targets.toTypedArray()
  }


  /**
   * This method will find the AEP policy period target
   */
  protected function findAEPPolicyPeriodTarget(accNum : String, levyYear : Integer, productKey : String) : PolicyPeriod {
    var productCode = _productCodeMap.get(productKey)
    if (productCode == null) {
      productCode = productKey
    }

    if (levyYear == null || productKey == null) {
      throw new DisplayableException("No LevyYear provided or valid ProductCode[${levyYear}][${productKey}]!")
    }

    var query = Query.make(PolicyTerm)
    query.compare(PolicyTerm#AEPACCNumber_ACC, Equals, accNum)
    query.compare(PolicyTerm#AEPProductCode_ACC, Equals, productCode)
    query.compare(PolicyTerm#AEPFinancialYear_ACC, Equals, levyYear)

    var validTerms = query.select().toList()

    if (validTerms == null || validTerms.Count == 0) {
      throw new DisplayableException("Can't find policy by [${accNum}][${levyYear}][${productKey}]!")
    }
    var ppList = new ArrayList<PolicyPeriod>()
    validTerms.each(\term -> {
      ppList.addAll(term.Periods.toList())
    })
    var orderedList = ppList.where(\pp -> (pp.Status == PolicyPeriodStatus.TC_BOUND || pp.Status == PolicyPeriodStatus.TC_AUDITCOMPLETE)
        && !pp.isCanceled())
        .orderBy(\pp -> pp.PeriodEnd)
        .thenBy(\pp -> pp.CreateTime)

    return orderedList.last()
  }

  /**
   * Get new monetary amount Earnings
   * if blank, return null
   */
  protected function getMonetaryAmount(amount : String) : MonetaryAmount {
    var decimalAmt : BigDecimal
    if (GosuStringUtil.isNotBlank(amount)) {
      try {
        decimalAmt = new BigDecimal(amount)
      } catch (e : NumberFormatException) {
        throw new DisplayableException("Can't convert  ${amount} to amount!")
      }
      return new MonetaryAmount(decimalAmt, CurrencyUtil.getDefaultCurrency())
    } else {
      return null
    }
  }

}