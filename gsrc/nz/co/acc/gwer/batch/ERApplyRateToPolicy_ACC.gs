package nz.co.acc.gwer.batch

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.pl.persistence.core.Key
uses gw.processes.WorkQueueBase
uses gw.surepath.suite.integration.logging.StructuredLogger_ACC
uses nz.co.acc.gwer.util.ERProcessUtils_ACC
uses gw.job.RenewalProcess
uses nz.co.acc.lob.util.ModifiersUtil_ACC
uses typekey.Job

uses java.math.BigDecimal
uses java.math.RoundingMode

class ERApplyRateToPolicy_ACC extends WorkQueueBase<ERRunLevyPayer_ACC, StandardWorkItem> {

  private var _hashMap : Map<ERProgramme_ACC, ExpRatingProgramme_ACC>
  private static var _logger = StructuredLogger_ACC.CONFIG.withClass(ERApplyRateToPolicy_ACC)

  construct () {
    super(BatchProcessType.TC_ERAPPLYRATETOPOLICY_ACC, StandardWorkItem, ERRunLevyPayer_ACC)
    _hashMap = new HashMap<ERProgramme_ACC, ExpRatingProgramme_ACC>()
    _hashMap.put(ERProgramme_ACC.TC_ER, ExpRatingProgramme_ACC.TC_EXPERIENCERATING)
    _hashMap.put(ERProgramme_ACC.TC_NCD, ExpRatingProgramme_ACC.TC_NOCLAIMSDISCOUNT)
    _hashMap.put(ERProgramme_ACC.TC_STD, ExpRatingProgramme_ACC.TC_STANDARD)
  }

  override function findTargets(): Iterator<ERRunLevyPayer_ACC> {
    var queryRunCalcResult = Query.make(ERRunLevyPayer_ACC)
        queryRunCalcResult.compare(ERRunLevyPayer_ACC#ERRunCalcResult, Relop.NotEquals, null)
    var polRunQuery = queryRunCalcResult.join(ERRunLevyPayer_ACC#ERRun)
        polRunQuery.compare(ERRun_ACC#ERRunStatus, Relop.Equals, ERRunStatus_ACC.TC_INPROGRESS)
    return queryRunCalcResult.select().iterator()
  }

  override function processWorkItem(item : StandardWorkItem) {
    try {
      var levyPayer = extractTarget(item)
      var erProcessUtils = new ERProcessUtils_ACC()
      var bundle = gw.transaction.Transaction.newBundle()
      var policyTerm = erProcessUtils.getPolicyTermByACCPolicyIDAndLevyYear(levyPayer.ACCPolicyID_ACC, levyPayer.ERRun.ERRequest.LevyYear).FirstResult
      var policyPeriod : PolicyPeriod

      if(policyTerm.LatestBranchID_ACC != null) {
        policyPeriod = Query.make(PolicyPeriod)
                            .compare(PolicyPeriod#ID, Relop.Equals, new Key(PolicyPeriod, policyTerm.LatestBranchID_ACC))
                            .select().FirstResult
      } else {
        policyPeriod = Query.make(PolicyPeriod)
                            .compare(PolicyPeriod#ACCPolicyID_ACC, Relop.Equals, levyPayer.ACCPolicyID_ACC)
                            .compare(PolicyPeriod#LevyYear_ACC, Relop.Equals, levyPayer.ERRun.ERRequest.LevyYear)
                            .select().FirstResult
      }

      gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\b -> {
        if(policyPeriod.Job.Subtype == Job.TC_AUDIT) {
          policyPeriod = bundle.add(policyPeriod)
          var audit = bundle.add(policyPeriod.Audit)
          policyPeriod = bundle.add(policyPeriod.Audit.revise())
          var auditInformation =  bundle.add(policyPeriod.Audit.AuditInformation)
          auditInformation.AuditMethod = AuditMethod.TC_MANUAL_ACC
          auditInformation.ReceivedDate = Date.CurrentDate
          policyPeriod = auditInformation.Audit.PolicyPeriod
          var auditProcess = auditInformation.Audit.LatestPeriod.AuditProcess
          applyModifiers(policyPeriod, levyPayer)
          auditProcess.requestQuote()
          auditProcess.complete()
        } else {
          if(policyPeriod.Job.Subtype == Job.TC_RENEWAL and policyPeriod.Status != PolicyPeriodStatus.TC_BOUND) {
            var newPeriod = bundle.add(policyPeriod.getSlice(policyPeriod.EditEffectiveDate))
            var renewalProcess = newPeriod.JobProcess as RenewalProcess
            if(renewalProcess.ActiveRenewalWorkflow != null) {
              renewalProcess.ActiveRenewalWorkflow.invokeTrigger(TC_EDITPOLICY)
            }
            else {
              renewalProcess.edit()
            }
            ModifiersUtil_ACC.syncModifiers(newPeriod)
            applyModifiers(newPeriod, levyPayer)
            if (newPeriod.Status == PolicyPeriodStatus.TC_DRAFT) {
              renewalProcess.requestQuote()
            }
            renewalProcess.pendingRenew()
          } else {
            var change = new PolicyChange()
            change.startJob(policyPeriod.Policy, policyPeriod.PeriodStart)

            var newPeriod = change.LatestPeriod
            var theProcess = newPeriod.PolicyChangeProcess
            applyModifiers(newPeriod, levyPayer)
            if (theProcess.canRequestQuote().Okay) {
              theProcess.requestQuote()
            }

            if (theProcess.canBind().Okay && theProcess.canIssue().Okay) {
              theProcess.issueJob(true)
            }
          }
        }
      })
    } catch(e: Exception) {
      _logger.error_ACC(e.getMessage(), e)
      e.printStackTrace()
      throw e
    }
  }

  function applyModifiers(policyPeriod : PolicyPeriod, levyPayer : ERRunLevyPayer_ACC) {
    var erProgramme = _hashMap.get(levyPayer.ERProgramme)
    _logger.info("applyModifiers ACCPolicyID_ACC : ${policyPeriod.ACCPolicyID_ACC}, ERProgramme ${erProgramme.Code}, ERMod ${levyPayer.ERRunCalcResult.ERMod}")
    var modifiers = ModifiersUtil_ACC.getModifiers(policyPeriod)
    ModifiersUtil_ACC.setSelectedExperienceRating(modifiers, policyPeriod.PolicyTerm, erProgramme)
    var rateModifer = ModifiersUtil_ACC.getExperienceRatingModRateModifier(modifiers)
    if(levyPayer.ERProgramme == ERProgramme_ACC.TC_STD) {
      rateModifer.RateModifier = BigDecimal.ZERO
    } else {
      rateModifer.RateModifier = levyPayer.ERRunCalcResult.ERMod.setScale(4, RoundingMode.HALF_UP)
    }
    var erProcessUtils = new ERProcessUtils_ACC()
    _logger.info("applyModifiers _erProcessUtils : ${erProcessUtils} levyYear_ACC ${policyPeriod.LevyYear_ACC} ERProgramme ${levyPayer.ERRunCalcResult.ERProgramme}")
    ModifiersUtil_ACC.getExperienceRatingCalcTypeModifiers(modifiers).ShorttextModifier = levyPayer.ERRunCalcResult.ERCalculationType.Name
    var runNumberModifier = ModifiersUtil_ACC.getExperienceRatingRunNumberModifier(modifiers)
    runNumberModifier.RateModifier = BigDecimal.ZERO
    runNumberModifier.ShorttextModifier = Long.toString(levyPayer.ERRun.ID.Value)
  }
}