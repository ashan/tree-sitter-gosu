package nz.co.acc.aep

uses gw.api.database.Relop
uses gw.api.locale.DisplayKey
uses gw.surepath.suite.integration.logging.StructuredLogger_ACC
uses gw.pl.persistence.core.Bundle
uses nz.co.acc.aep.master.contractpolicy.ui.PlanDateUIHelper
uses gw.api.util.DateUtil
uses gw.api.database.Query
uses nz.co.acc.validforclaims.ValidForClaimsPreUpdate

/**
 * Preupdate rule for triggering on AEP PolicyPeriod
 */
class AEPPolicyPeriodPreupdateImpl {
  static final var LOG = StructuredLogger_ACC.RULES.withClass(AEPPolicyPeriodPreupdateImpl)
  static final var _instance : AEPPolicyPeriodPreupdateImpl as readonly Instance = new AEPPolicyPeriodPreupdateImpl()

  /**
   * The rules for Policy period
   *
   * @param entity
   */
  function executePreUpdate(entity : PolicyPeriod) {
    var previousPhase = entity.PolicyTerm.AEPPhase_ACC

    updateAEPMemberHistoryFieldsOnTerm(entity)
    updateAEPActivityOnAccount(entity)
    initializeAEPPlanDates(entity)
    clearAEPMemberCUData(entity)
    createAndAddAEPMemberCUData(entity)

    setAEPPhaseToContractData(entity)
    setAEPPhaseToAccepted(entity)
    setAEPPhaseToPostedToBC(entity)
    setAEPPhaseToInFinalAudit(entity)

    triggerFinalAuditOnAEPMasterPolicy(entity, previousPhase)
    setAEPPrimeOnAccount(entity)
    rerateAEPMasterPolicy(entity)
  }

  private function updateAEPMemberHistoryFieldsOnTerm(policyPeriod : PolicyPeriod) {
    var job = policyPeriod.Job

    if ((job typeis Submission || job typeis Rewrite || job typeis RewriteNewAccount || job typeis Renewal)
        and policyPeriod.Status == PolicyPeriodStatus.TC_BOUND) {
      if (!policyPeriod.Policy.Account.AEPContractAccount_ACC and policyPeriod.Policy.Account.ACCID_ACC != null) {
        policyPeriod.PolicyTerm.AEPACCNumber_ACC = policyPeriod.Policy.Account.ACCID_ACC
        policyPeriod.PolicyTerm.AEPProductCode_ACC = policyPeriod.Policy.ProductCode
      } else if (policyPeriod.BasedOn.PolicyTerm.AEPACCNumber_ACC != null) {
        policyPeriod.PolicyTerm.AEPACCNumber_ACC = policyPeriod.BasedOn.PolicyTerm.AEPACCNumber_ACC
        policyPeriod.PolicyTerm.AEPProductCode_ACC = policyPeriod.BasedOn.PolicyTerm.AEPProductCode_ACC
      }
    }
  }

  private function updateAEPActivityOnAccount(policyPeriod : PolicyPeriod) {
    var job = policyPeriod.Job

    if (job typeis RewriteNewAccount and policyPeriod.Status == PolicyPeriodStatus.TC_BOUND) {
      var newAccount = policyPeriod.Policy.Account
      var oldAccount = policyPeriod.BasedOn.Policy.Account
      if (!newAccount.AEPContractAccount_ACC and !oldAccount.AEPContractAccount_ACC) {
        return
      }

      newAccount.AEPActivityExists_ACC = true
      oldAccount.AEPActivityExists_ACC = true
    }
  }

  private function initializeAEPPlanDates(policyPeriod : PolicyPeriod) {
    var job = policyPeriod.Job

    if (!(job typeis Renewal)) {
      return
    }

    if (!policyPeriod.IsAEPMasterPolicy_ACC) {
      return
    }

    if (policyPeriod.Status != PolicyPeriodStatus.TC_DRAFT) {
      return
    }

    var originalStatus = {PolicyPeriodStatus.TC_TEMPORARY, PolicyPeriodStatus.TC_RENEWING}
    if (!originalStatus.contains(policyPeriod.getOriginalValue("Status"))) {
      return
    }

    logInfo(policyPeriod, "Initializing plan dates")
    PlanDateUIHelper.initializePlanDates(policyPeriod)
  }

  private function clearAEPMemberCUData(policyPeriod : PolicyPeriod) {
    var job = policyPeriod.Job

    if (!(job typeis PolicyChange || job typeis Audit || job typeis Renewal)) {
      return
    }

    if (!policyPeriod.IsAEPMasterPolicy_ACC) {
      return
    }

    var validStatus = {PolicyPeriodStatus.TC_DRAFT, PolicyPeriodStatus.TC_QUOTING}
    if (!validStatus.contains(policyPeriod.Status)) {
      return
    }

    var originalStatus = {PolicyPeriodStatus.TC_TEMPORARY, PolicyPeriodStatus.TC_RENEWING}
    if (!originalStatus.contains(policyPeriod.getOriginalValue("Status"))) {
      return
    }

    logInfo(policyPeriod, "Clearing existing AEP member data and rateable CU data")
    var aepLine = policyPeriod.AEPLine
    aepLine.clearExistingAEPMemberData_ACC()
    aepLine.clearExistingAEPRateableCUData_ACC()
  }

  private function createAndAddAEPMemberCUData(policyPeriod : PolicyPeriod) {
    var job = policyPeriod.Job

    if (!(job typeis PolicyChange || job typeis Audit)) {
      return
    }

    if (!policyPeriod.IsAEPMasterPolicy_ACC) {
      return
    }

    var validStatus = {PolicyPeriodStatus.TC_DRAFT, PolicyPeriodStatus.TC_QUOTING}
    if (!validStatus.contains(policyPeriod.Status)) {
      return
    }

    if (not policyPeriod.PolicyTerm.canPerformAEPAction_ACC(AEPAction_ACC.TC_CREATE_AEP_MEMBER_CU_DATA)) {
      return
    }

    var aepLine = policyPeriod.AEPLine
    if (aepLine.AEPMemberData.HasElements or aepLine.AEPRateableCUData.HasElements) {
      return
    }

    logInfo(policyPeriod, "Creating and mapping AEP member data and rateable data")
    aepLine.createAndMapAEPMemberAndRateableData_ACC()
  }

  private function setAEPPhaseToContractData(policyPeriod : PolicyPeriod) {
    var job = policyPeriod.Job
    if (!(job typeis Renewal)) {
      return
    }

    if (!policyPeriod.IsAEPMasterPolicy_ACC) {
      return
    }

    var validStatus = {PolicyPeriodStatus.TC_DRAFT}
    if (!validStatus.contains(policyPeriod.Status)) {
      return
    }

    if (policyPeriod.getOriginalValue("Status") != PolicyPeriodStatus.TC_TEMPORARY) {
      return
    }

//    if (not policyPeriod.PolicyTerm.canPerformAEPAction_ACC(AEPAction_ACC.TC_CREATE_AEP_MEMBER_CU_DATA))
//      return

    logInfo(policyPeriod, "Updating AEPPhase_ACC to TC_CONTRACT_DATA")
    policyPeriod.PolicyTerm.AEPPhase_ACC = AEPPhase_ACC.TC_CONTRACT_DATA
  }

  private function setAEPPhaseToAccepted(policyPeriod : PolicyPeriod) {
    if (policyPeriod.IsAEPMasterPolicy_ACC and
        (policyPeriod.Job typeis Submission or policyPeriod.Job typeis Renewal) and
        policyPeriod.PolicyTerm.canPerformAEPAction_ACC(AEPAction_ACC.TC_SET_AEP_PHASE_TO_ACCEPTED) and
        policyPeriod.Status == PolicyPeriodStatus.TC_BOUND) {
      logInfo(policyPeriod, "Updating AEPPhase_ACC to TC_ACCEPTED")
      policyPeriod.PolicyTerm.AEPPhase_ACC = AEPPhase_ACC.TC_ACCEPTED
    }
  }

  private function setAEPPhaseToPostedToBC(policyPeriod : PolicyPeriod) {
    var job = policyPeriod.Job

    if (!(job typeis PolicyChange)) {
      return
    }

    if (!policyPeriod.IsAEPMasterPolicy_ACC) {
      return
    }

    if (policyPeriod.Status != PolicyPeriodStatus.TC_BOUND) {
      return
    }

    if (not policyPeriod.PolicyTerm.canPerformAEPAction_ACC(AEPAction_ACC.TC_SET_AEP_PHASE_TO_POSTED_TO_BC)) {
      return
    }

    logInfo(policyPeriod, "Updating AEPPhase_ACC to TC_POSTED_TO_BC")
    policyPeriod.PolicyTerm.AEPPhase_ACC = AEPPhase_ACC.TC_POSTED_TO_BC
  }

  private function setAEPPhaseToInFinalAudit(policyPeriod : PolicyPeriod) {
    var job = policyPeriod.Job

    if (!(job typeis Audit)) {
      return
    }

    if (!policyPeriod.IsAEPMasterPolicy_ACC) {
      return
    }

    var validStatus = {PolicyPeriodStatus.TC_DRAFT, PolicyPeriodStatus.TC_QUOTING}
    if (!validStatus.contains(policyPeriod.Status)) {
      return
    }

    if (not policyPeriod.PolicyTerm.canPerformAEPAction_ACC(AEPAction_ACC.TC_SET_AEP_PHASE_TO_IN_FINAL_AUDIT)) {
      return
    }

    logInfo(policyPeriod, "Updating AEPPhase_ACC to TC_IN_FINAL_AUDIT")
    policyPeriod.PolicyTerm.AEPPhase_ACC = AEPPhase_ACC.TC_IN_FINAL_AUDIT
  }

  private function rerateAEPMasterPolicy(policyPeriod : PolicyPeriod) {
    var validPolicyPeriodStatus: PolicyPeriodStatus[]
    if (policyPeriod.IsAEPMasterPolicy_ACC) {
      validPolicyPeriodStatus = {PolicyPeriodStatus.TC_BOUND, PolicyPeriodStatus.TC_WITHDRAWN, PolicyPeriodStatus.TC_EXPIRED}
    } else if (policyPeriod.IsAEPMemberPolicy_ACC) {
      validPolicyPeriodStatus = {PolicyPeriodStatus.TC_BOUND}
    } else {
      return
    }

    if (not(policyPeriod.ChangedFields.contains("Status") and validPolicyPeriodStatus.contains(policyPeriod.Status))) {
      return
    }

    if (policyPeriod.IsAEPMasterPolicy_ACC and policyPeriod.Job.InternalJob_ACC) {
      return
    }

    var masterPolicyTerm: PolicyTerm
    var masterPolicyPeriod: PolicyPeriod

    if (policyPeriod.IsAEPMasterPolicy_ACC) {
      masterPolicyTerm = policyPeriod.PolicyTerm
      masterPolicyPeriod = policyPeriod
    } else if (policyPeriod.IsAEPMemberPolicy_ACC) {
      masterPolicyTerm = policyPeriod.AEPMasterPolicy_ACC.getLatestBoundPeriodForLevyYear_ACC(policyPeriod.LevyYear_ACC).PolicyTerm
      masterPolicyPeriod = policyPeriod.AEPMasterPolicy_ACC.getLatestBoundPeriodForLevyYear_ACC(policyPeriod.LevyYear_ACC)
      // Can't find the policy period with the levy year
      if (masterPolicyPeriod == null) {
        return
      }
    } else {
      return
    }

    // Check if policyPeriod is a policy change for terminating AEP contract.
    // We don't need to rerate as all member policies should have been removed.
    if (policyPeriod.Job typeis PolicyChange and policyPeriod.Job.AEPPhaseBeforeTerminate_ACC != null) {
      return
    }

    if (masterPolicyPeriod.Policy.Account.checkIfAnyAEPMemberPolicyOnHoldFromReassessment_ACC() != null) {
      return
    }

    if (masterPolicyPeriod.hasOtherOpenTransactionsOnPolicyTerm_ACC()) {
      return
    }

    // Check if the policy is terminated on the start date.
    // We don't need to rerate as the effective period is 0.
    // Notice we don't need to check the phase Terminating as it will be a active policy change
    // and will be skipped by the previous check
    if (masterPolicyTerm.AEPPhase_ACC == AEPPhase_ACC.TC_TERMINATED and
        masterPolicyPeriod.PeriodStart?.compareIgnoreTime(masterPolicyPeriod.Policy.Account.AEPContractTerminationDate_ACC) == 0) {
      return
    }

    if (masterPolicyTerm.canPerformAEPAction_ACC(AEPAction_ACC.TC_RERATE_MASTER_POLICY)) {
      logInfo(policyPeriod, "Creating AEPRateMaster instruction")
      var i = new Instruction_ACC() {
        :InstructionType_ACC = InstructionType_ACC.TC_AEPRATEMASTER,
        :IsSynchronous = Boolean.FALSE,
        :AccountNumber = policyPeriod.Policy.Account.AccountNumber,
        :LevyYear = policyPeriod.LevyYear_ACC
      }
      i = policyPeriod.Bundle.add(i)
      i.doInitOfNewRecord()
    }
  }

  private function triggerFinalAuditOnAEPMasterPolicy(policyPeriod : PolicyPeriod, previousPhase : AEPPhase_ACC) {
    var validJobType = false
    var job = policyPeriod.Job

    if (policyPeriod.IsAEPMasterPolicy_ACC and job.InternalJob_ACC) {
      return
    }
    var validPolicyPeriodStatus: PolicyPeriodStatus[]

    if (policyPeriod.IsAEPMasterPolicy_ACC) {
      validPolicyPeriodStatus = {PolicyPeriodStatus.TC_BOUND}
      validJobType = (job typeis PolicyChange)
    } else if (policyPeriod.IsAEPMemberPolicy_ACC) {
      validPolicyPeriodStatus = {PolicyPeriodStatus.TC_AUDITCOMPLETE, PolicyPeriodStatus.TC_BOUND}
      validJobType = (job typeis Audit or job typeis PolicyChange)
    } else {
      return
    }

    if (!validJobType) {
      return
    }

    if (not(policyPeriod.ChangedFields.contains("Status") and validPolicyPeriodStatus.contains(policyPeriod.Status))) {
      return
    }

    var levyYear: Integer

    if (policyPeriod.IsAEPMasterPolicy_ACC) {
      if (policyPeriod.PolicyTerm.AEPPhase_ACC == AEPPhase_ACC.TC_POSTED_TO_BC and previousPhase == AEPPhase_ACC.TC_READY_FOR_BC) {
        levyYear = policyPeriod.LevyYear_ACC - 1
      }
      else {
        return
      }
    } else {
      levyYear = policyPeriod.LevyYear_ACC
    }

    var masterPolicyPeriod = policyPeriod.AEPMasterPolicy_ACC?.getLatestBoundPeriodForLevyYear_ACC(levyYear)
    var masterPolicyTerm = masterPolicyPeriod?.PolicyTerm

    if (masterPolicyTerm == null) {
      return
    }

    if (masterPolicyPeriod.hasOtherOpenTransactionsOnPolicyTerm_ACC()) {
      return
    }

    // Check if the policy is terminated on the start date.
    // We don't need to rerate as the effective period is 0.
    // Notice we don't need to check the phase Terminating as it will be a active policy change
    // and will be skipped by the previous check
    if (masterPolicyTerm.AEPPhase_ACC == AEPPhase_ACC.TC_TERMINATED
        and masterPolicyPeriod.PeriodStart?.compareIgnoreTime(masterPolicyPeriod.Policy.Account.AEPContractTerminationDate_ACC) == 0) {
      return
    }

    var validAEPPhase: AEPPhase_ACC[]

    if (policyPeriod.IsAEPMasterPolicy_ACC) {
      validAEPPhase = {AEPPhase_ACC.TC_POSTED_TO_BC, AEPPhase_ACC.TC_TERMINATED}
    } else {
      validAEPPhase = {AEPPhase_ACC.TC_IN_FINAL_AUDIT}
    }

    if (validAEPPhase.contains(masterPolicyTerm.AEPPhase_ACC)) {
      logInfo(policyPeriod, "Creating AEPAuditMaster instruction")
      var i = new Instruction_ACC() {
        :InstructionType_ACC = InstructionType_ACC.TC_AEPAUDITMASTER,
        :IsSynchronous = Boolean.FALSE,
        :AccountNumber = policyPeriod.Policy.Account.AccountNumber,
        :LevyYear = levyYear
      }

      i = policyPeriod.Bundle.add(i)
      i.doInitOfNewRecord()
    }
  }

  private function setAEPPrimeOnAccount(policyPeriod : PolicyPeriod) {
    if (policyPeriod.IsAEPMasterPolicy_ACC
        and policyPeriod.isFieldChanged(PolicyPeriod#Status)
        and policyPeriod.Status == PolicyPeriodStatus.TC_BOUND
        and not policyPeriod.Job.InternalJob_ACC
        and policyPeriod.AltBillingAccountNumber != null) {

      var currentAEPPrime = policyPeriod.BasedOn.AltBillingAccountNumber
      var selectedAccount = Account.finder.findAccountByAccountNumber(policyPeriod.AltBillingAccountNumber)

      if (selectedAccount != null and policyPeriod.AltBillingAccountNumber != currentAEPPrime) {
        logInfo(policyPeriod, "Updating AEP Prime relationship")
        // Add AEP Prime relationship
        var accountAccount = new AccountAccount()
        accountAccount.RelationshipType = AccountRelationshipType.TC_AEP_PRIME_ACC
        accountAccount.TargetAccount = selectedAccount
        accountAccount.EffectiveDateFrom_ACC = DateUtil.currentDate()
        accountAccount.AppliedLevyYear_ACC = policyPeriod.LevyYear_ACC
        policyPeriod.Policy.Account.addToSourceRelatedAccounts(accountAccount)

        // Change contract account name to prime account name
        var contractContact = policyPeriod.Policy.Account.AccountHolderContact
        var primeContact = selectedAccount.AccountHolderContact
        if (primeContact typeis Company and contractContact typeis Company) {
          primeContact.Name = contractContact.Name
          primeContact.LegalName = contractContact.LegalName
        }
      }

      // JUNO-488 Add account history event
      if (policyPeriod.AltBillingAccountNumber != policyPeriod.AltBillingAccountNumber_ACC) {
        // AEP Prime has changed
        var originalPrimeAccount : Account = null
        if (currentAEPPrime != null) {
          originalPrimeAccount = Account.finder.findAccountByAccountNumber(currentAEPPrime)
        }
        var originalPrimeACCID = originalPrimeAccount?.ACCID_ACC ?: ""
        var aepAccount = policyPeriod.Policy.Account
        aepAccount.createCustomHistoryEvent(CustomHistoryType.TC_PRIME_ACCT_CHANGED, \-> DisplayKey.get("Account.History.PrimeAccountChanged"), originalPrimeACCID, selectedAccount.ACCID_ACC)
        ValidForClaimsPreUpdate.onAEPPrimeChange(policyPeriod.Bundle, aepAccount, originalPrimeAccount, selectedAccount, policyPeriod.LevyYear_ACC)
      }
    }
  }

  private function logInfo(policyPeriod : PolicyPeriod, msg : String) {
    LOG.info("PolicyNumber: ${policyPeriod.PolicyNumber}, Transaction: ${policyPeriod.Job.JobNumber}, Branch: ${policyPeriod.ID}, JobType: ${policyPeriod.Job.Subtype} - " + msg)
  }

}