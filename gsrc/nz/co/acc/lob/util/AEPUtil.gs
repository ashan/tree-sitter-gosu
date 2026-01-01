package nz.co.acc.lob.util

uses java.math.BigDecimal

/**
 * Created by ManubaF on 16/06/2017.
 */
class AEPUtil {
  static function getAuditResultDiscountRate(auditResult : AEPAuditResult_ACC) : BigDecimal {
    if (auditResult == AEPAuditResult_ACC.TC_PRIMARY) {
      return ScriptParameters.getParameterValue("AEPPrimaryDiscount_ACC") as BigDecimal
    } else if (auditResult == AEPAuditResult_ACC.TC_SECONDARY) {
      return ScriptParameters.getParameterValue("AEPSecondaryDiscount_ACC") as BigDecimal
    } else if (auditResult == AEPAuditResult_ACC.TC_TERTIARY) {
      return ScriptParameters.getParameterValue("AEPTertiaryDiscount_ACC") as BigDecimal
    }
    return BigDecimal.ZERO
  }

  static function getAEPWarningMessage(policyPeriod : PolicyPeriod) : String {
    if (policyPeriod.IsAEPMemberPolicy_ACC == false and policyPeriod.NewAEPCustomer_ACC) {
      return "New customer straight into AEP"
    } else if (policyPeriod.Policy.RewrittenToNewAccountSource != null and
        policyPeriod.IsAEPMemberPolicy_ACC == false and
        policyPeriod.CeasedTrading_ACC) {
      return "Customer exited AEP and ceased"
    }
    return null
  }

  // Chris A 27/01/2021 JUNO-7123 Remove AEP Discount Rate
  static function getAuditDiscount(levyYear : int, accID_ACC : String, auditResult : AEPAuditResult_ACC) : BigDecimal {

//    If levy year is 2020 and not PP1220194000 then return discount based on audit result
//    else if levy year is 2020 and PP1220194000 then return 0
//    else if levy year is 2021 and above then return 0
    if (!ScriptParameters.AEPDiscountAccountsToExclude_ACC.contains(accID_ACC)) {
      if (levyYear < 2021) {
        return getAuditResultDiscountRate(auditResult)
      }
    }
    return 0
  }
}