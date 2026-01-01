package gw.bizrules.provisioning.contexts

uses typekey.PolicyLine

/**
 * Created by Andy Schulz on 25/05/2017.
 */
class AuditOnHoldContextDefinition_ACC extends GenericUWRuleContextDefinition {
  public static final var PARAM_PREVENT_REASSESSMENT: String = "ParamPreventReassessment_ACC"
  public static final var AUDIT_ON_HOLD_PREVENT_REASSESSMENT: String = "AuditOnHoldPreventReassessment_ACC"

  override function appliesToPolicyLines(lines: PolicyLine[]): boolean {
    return lines.HasElements and lines.allMatch(\line ->
        line == TC_EMPWPCLINE or
        line == TC_CWPSLINE)
  }

  override property get Key(): RuleContextDefinitionKey {
    return RuleContextDefinitionKey.TC_REASSESSMENT_ACC
  }

  construct() {
    addSymbol(PARAM_PREVENT_REASSESSMENT, Boolean, \ec -> {
      //True is this is a migrated policy and the policy is on hold for reassessment and the period is not being migrated
      if (ec.Period.Migrated_ACC == null or ec.Period.PolicyTerm.HoldReassessment_ACC == null) {
        return false
      } else {
        return !ec.Period.Migrating_ACC and ec.Period.Migrated_ACC and ec.Period.PolicyTerm.HoldReassessment_ACC
      }
    })
  }
}