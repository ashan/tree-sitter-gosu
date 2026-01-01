package gw.bizrules.provisioning.contexts

uses typekey.*
uses typekey.PolicyLine

/**
 * Created by Ian Rainford on 25/05/2017.
 */
class ReassessmentContextDefinition_ACC extends GenericUWRuleContextDefinition {
  public static final var PARAM_PREVENT_REASSESSMENT: String = "ParamPreventReassessment_ACC"
  public static final var CODE_PREVENT_REASSESSMENT: String = "CodeReassessment_ACC"

  override function appliesToPolicyLines(lines: typekey.PolicyLine[]): boolean {
    return lines.HasElements and lines.allMatch(\line ->
        line == TC_EMPWPCLINE or
        line == TC_CWPSLINE or
        line == TC_INDCOPLINE or
        line == TC_INDCPXLINE)
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
        return ec.Period.Migrated_ACC and ec.Period.PolicyTerm.HoldReassessment_ACC
      }
    })
  }
}