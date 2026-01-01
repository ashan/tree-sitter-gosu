package nz.co.acc.validforclaims

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.api.system.database.SequenceUtil
uses gw.pl.persistence.core.Bundle
uses gw.surepath.suite.integration.logging.StructuredLogger_ACC
uses nz.co.acc.integration.junoinformationservice.preupdate.JISPreupdateHandler
uses nz.co.acc.plm.integration.ir.util.ConstantPropertyHelper

class ValidForClaimsPreUpdate {
  static final var LOG = StructuredLogger_ACC.CONFIG.withClass(ValidForClaimsPreUpdate)

  static function executePreUpdate(policy : Policy) {
    handleStatusChanged(policy)
  }

  static function executePreUpdate(policyPeriod : PolicyPeriod) {
    if (policyPeriod.Canceled) {
      var policyTerm = policyPeriod.PolicyTerm
      LOG.info("executePreUpdate: VFC set to false on cancellation: policyterm ${policyTerm.PublicID} - ${policyTerm.AEPFinancialYear_ACC} - ${policyTerm.Policy.Account.ACCID_ACC}")
      policyTerm.ValidForClaimsReg_ACC = false
      policyTerm.VFCUpdatePending_ACC = false
      policyTerm.VFCOverrideDate_ACC = null
      new JISPreupdateHandler().handlePolicyPeriodChanged(policyPeriod)

    } else if (policyPeriod.isFieldChanged(PolicyPeriod#Status) and policyPeriod.isBoundOrAudited_ACC) {
      if (policyPeriod.Job.IsRenewal_ACC) {
        var isVFC = isRenewalVFC(policyPeriod)
        var policyTerm = policyPeriod.PolicyTerm
        policyTerm.ValidForClaimsReg_ACC = isVFC
        LOG.info("executePreUpdate: Initializing VFC on renewal: policyterm ${policyTerm.PublicID} - ${policyTerm.AEPFinancialYear_ACC} - ${policyTerm.Policy.Account.ACCID_ACC} isVFC=${isVFC}")
        policyTerm.VFCUpdatePending_ACC = false
        policyTerm.VFCOverrideDate_ACC = null
        new JISPreupdateHandler().handlePolicyPeriodChanged(policyPeriod)

      } else {
        var policyTerm = policyPeriod.PolicyTerm
        LOG.info("executePreUpdate: Flagging VFC for update: policyterm ${policyTerm.PublicID} - ${policyTerm.AEPFinancialYear_ACC} - ${policyTerm.Policy.Account.ACCID_ACC}")
        policyTerm.VFCUpdatePending_ACC = true
        policyTerm.VFCOverrideDate_ACC = null
      }
    }
  }

  static function onAEPPrimeChange(bundle : Bundle, contractAccount : Account, originalPrimeAccount : Account, newPrimeAccount : Account, levyYear : int) {
    LOG.info("AEP Prime changed. Flagging policy terms for VFC update for AEP account ${contractAccount.ACCID_ACC}")

    if (originalPrimeAccount != null) {
      flagPolicyTermForVFCUpdate(bundle, contractAccount.Policies, originalPrimeAccount.ACCID_ACC, levyYear)
      createVFCInstruction(bundle, originalPrimeAccount)
    }
    flagPolicyTermForVFCUpdate(bundle, contractAccount.Policies, newPrimeAccount.ACCID_ACC, levyYear)
    createVFCInstruction(bundle, newPrimeAccount)
    createVFCInstruction(bundle, contractAccount)
  }

  static function onPreventReassessmentChanged(bundle : Bundle, account : Account) {
    LOG.info("Prevent Reassessment changed. Flagging policy terms for VFC update for account ${account.ACCID_ACC}")

    for (policy in account.Policies) {
      var policyTerms = policy.PolicyTermFinder_ACC.policyTerms()
      for (policyTerm in policyTerms) {
        policyTerm = bundle.add(policyTerm)
        policyTerm.VFCUpdatePending_ACC = true
        policyTerm.VFCOverrideDate_ACC = null
      }
    }

    createVFCInstruction(bundle, account)
  }

  private static function createVFCInstruction(bundle : Bundle, account : Account) {
    LOG.info("Creating VFC Instruction for account ${account.ACCID_ACC}")
    var instruction = new InstructionRecord_ACC(bundle)
    instruction.InstructionType_ACC = InstructionType_ACC.TC_VALIDFORCLAIMS
    instruction.ACCID = account.ACCID_ACC
    instruction.Status = InstructionRecordStatus_ACC.TC_UNPROCESSED
    instruction.RecordSequence = SequenceUtil.next(1, ConstantPropertyHelper.SEQUENCE_INBOUND)
    instruction.Source = InstructionSource_ACC.TC_PREUPDATE
  }

  private static function flagPolicyTermForVFCUpdate(bundle : Bundle, policyList : Policy[], accID : String, levyYear : int) {
    var policies = policyList.where(\policy -> policy.RewrittenToNewAccountSource?.Account?.ACCID_ACC == accID)

    for (policy in policies) {
      var policyTerms = Query.make(PolicyTerm)
          .compare(PolicyTerm#Policy, Relop.Equals, policy)
          .compare(PolicyTerm#AEPFinancialYear_ACC, Relop.Equals, levyYear)
          .select()
          .toTypedArray()

      for (policyTerm in policyTerms) {
        LOG.info("flagPolicyTermForVFCUpdate: policyterm ${policyTerm.PublicID} - ${policyTerm.AEPFinancialYear_ACC} - ${policyTerm.Policy.Account.ACCID_ACC}")
        policyTerm = bundle.add(policyTerm)
        policyTerm.VFCUpdatePending_ACC = true
        policyTerm.VFCOverrideDate_ACC = null
      }
    }
  }

  /**
   * Flag policy terms for status update if policy status has changed
   *
   * @param policy
   */
  public static function handleStatusChanged(policy : Policy) {
    if (policy.isFieldChanged(Policy#Status_ACC)) {
      var currentLevyYear = Date.Now.LevyYear_ACC
      var policyTerms = policy.PolicyTermFinder_ACC.findPolicyTermsBetweenLevyYears(currentLevyYear - 1, currentLevyYear)
      var bundle = policy.Bundle
      for (policyTerm in policyTerms) {
        var isVFC = isPolicyStatusChangeVFC(policyTerm, policy.Status_ACC)
        LOG.info("handleStatusChanged: policyterm ${policyTerm.PublicID} - ${policyTerm.AEPFinancialYear_ACC} - ${policyTerm.Policy.Account.ACCID_ACC} isVFC=${isVFC}")
        bundle.add(policyTerm).ValidForClaimsReg_ACC = isVFC
        bundle.add(policyTerm).VFCUpdatePending_ACC = false
        bundle.add(policyTerm).VFCOverrideDate_ACC = null
      }
    }
  }

  private static function isPolicyStatusChangeVFC(policyTerm : PolicyTerm, policyStatus : PolicyStatus_ACC) : Boolean {
    final var policy = policyTerm.Policy
    final var account = policy.Account
    final var currentLevyYear = Date.Now.LevyYear_ACC

    if (policy.IsAEPMasterPolicy_ACC) {
      LOG.info("PolicyTerm ${policyTerm.PublicID} is AEP master policy")
      return false

    } else if (account.PreventReassessment_ACC) {
      LOG.info("PolicyTerm ${policyTerm.PublicID} has PreventReassessment_ACC=true")
      return false

    } else if (policy.IsAEPMemberPolicy_ACC) {
      var policyPeriod = policyTerm.findLatestBoundOrAuditedPeriod_ACC()
      if (policyPeriod == null) {
        LOG.info("PolicyTerm ${policyTerm.PublicID} has no bound/audited policyPeriod")
        return false
      }
      var flag = ValidForClaimsUtil.isAEPPrime(policyPeriod)
      LOG.info("PolicyTerm ${policyTerm.PublicID} is AEP member policy, isPrime=${flag}")
      return flag

    } else if (policyTerm.AEPFinancialYear_ACC == currentLevyYear or policyTerm.AEPFinancialYear_ACC == currentLevyYear - 1) {
      LOG.info("PolicyTerm ${policyTerm.PublicID} is current or previous year (PolicyStatus=${policyStatus})")
      return policyStatus == PolicyStatus_ACC.TC_ACTIVE

    } else {
      LOG.info("PolicyTerm ${policyTerm.PublicID} has ActiveTerm_ACC=${policyTerm.ActiveTerm_ACC}")
      return policyTerm.ActiveTerm_ACC
    }
  }

  private static function isRenewalVFC(policyPeriod : PolicyPeriod) : Boolean {
    final var policy = policyPeriod.Policy
    final var account = policy.Account
    final var currentLevyYear = Date.Now.LevyYear_ACC

    if (policy.IsAEPMasterPolicy_ACC) {
      LOG.info("Renewal ${policyPeriod.PolicyTerm.PublicID} is AEP master policy")
      return false

    } else if (account.PreventReassessment_ACC) {
      LOG.info("Renewal ${policyPeriod.PolicyTerm.PublicID} has PreventReassessment_ACC=true")
      return false

    } else if (policy.IsAEPMemberPolicy_ACC) {
      var flag = ValidForClaimsUtil.isAEPPrime(policyPeriod)
      LOG.info("Renewal ${policyPeriod.PolicyTerm.PublicID} is AEP member policy, isPrime=${flag}")
      return flag

    } else if (policyPeriod.LevyYear_ACC == currentLevyYear or policyPeriod.LevyYear_ACC == currentLevyYear - 1) {
      LOG.info("Renewal ${policyPeriod.PolicyTerm.PublicID} is current or previous year")
      return true

    } else {
      LOG.info("Renewal ${policyPeriod.PolicyTerm.PublicID} is not VFC")
      return false
    }
  }

}