package nz.co.acc.validforclaims

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.surepath.suite.integration.logging.StructuredLogger_ACC

class ValidForClaimsUtil {
  private static var LOG = StructuredLogger_ACC.CONFIG.withClass(ValidForClaimsUtil)

  public static function isAEPPrime(policyPeriod : PolicyPeriod) : boolean {
    var policy = policyPeriod.Policy

    if (not policy.IsAEPMemberPolicy_ACC) {
      return false

    } else {
      var accountNumber = policy.RewrittenToNewAccountSource?.Account?.AccountNumber
      if (accountNumber == null) {
        return false
      }

      if (policyPeriod.LevyYear_ACC == Date.Now.LevyYear_ACC) {
        // Current year
        return policy.Account.CurrentAEPPrimeAccountNumber_ACC == accountNumber
      } else {
        // Historical year
        var primeAccountAtLevyYear = policyPeriod.getAEPPrimeMemberAccountAtDate_ACC(policyPeriod.PeriodEnd)
        return primeAccountAtLevyYear.Present and primeAccountAtLevyYear.get().AccountNumber == accountNumber
      }
    }
  }

  static function isPolicyTermVFC(policyPeriod : PolicyPeriod) : Boolean {
    final var policy = policyPeriod.Policy
    final var account = policy.Account
    final var currentLevyYear = Date.Now.LevyYear_ACC

    if (policyPeriod.Canceled) {
      LOG.info("PolicyTerm ${displayString(policyPeriod)} on Account ${account.ACCID_ACC} is canceled")
      return false

    } else if (account.PreventReassessment_ACC) {
      LOG.info("PolicyTerm ${displayString(policyPeriod)} on Account ${account.ACCID_ACC} PreventReassessment_ACC=true")
      return false

    } else if (policy.IsAEPMemberPolicy_ACC) {
      var flag = ValidForClaimsUtil.isAEPPrime(policyPeriod)
      LOG.info("PolicyTerm ${displayString(policyPeriod)} on Account ${account.ACCID_ACC} is AEP member policy, isPrime=${flag}")
      return flag

    } else if (policy.IsAEPMasterPolicy_ACC) {
      LOG.info("PolicyTerm ${displayString(policyPeriod)} on Account ${account.ACCID_ACC} is AEP master policy")
      return false

    } else if (policyPeriod.LevyYear_ACC == currentLevyYear or policyPeriod.LevyYear_ACC == currentLevyYear - 1) {
      LOG.info("PolicyTerm ${displayString(policyPeriod)} on Account ${account.ACCID_ACC} is current or previous year")
      return policy.Status_ACC == PolicyStatus_ACC.TC_ACTIVE

    } else {
      LOG.info("PolicyTerm ${displayString(policyPeriod)} on Account ${account.ACCID_ACC} has ActiveTerm_ACC=${policyPeriod.PolicyTerm.ActiveTerm_ACC}")
      return policyPeriod.PolicyTerm.ActiveTerm_ACC
    }
  }

  static function displayString(policyTerm : PolicyTerm) : String {
    return "PolicyTerm ${policyTerm.PublicID} - ${policyTerm.AEPProductCode_ACC} - ${policyTerm.AEPFinancialYear_ACC}"
  }

  static function displayString(policyPeriod : PolicyPeriod) : String {
    return displayString(policyPeriod.PolicyTerm)
  }

  static function hasPendingVFCUpdateForLatestTerm(account : Account) : boolean {
    return Query.make(Account)
        .compare(Account#ID, Relop.Equals, account.ID)
        .join(Policy#Account)
        .join(PolicyTerm#Policy)
        .compare(PolicyTerm#VFCUpdatePending_ACC, Relop.Equals, true)
        .or(\orCriteria -> {
          orCriteria.compare(PolicyTerm#MostRecentTerm, Relop.Equals, true)
          orCriteria.compare(PolicyTerm#AEPFinancialYear_ACC, Relop.Equals, Date.Now.LevyYear_ACC)
        })
        .select()
        .HasElements
  }

}