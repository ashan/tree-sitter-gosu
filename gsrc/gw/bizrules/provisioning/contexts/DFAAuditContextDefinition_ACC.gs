package gw.bizrules.provisioning.contexts

uses nz.co.acc.rules.DelegateFinancialAuthority_ACC
uses typekey.PolicyLine

@Export
class DFAAuditContextDefinition_ACC extends GenericUWRuleContextDefinition {

  public static final var PARAM_DFA_AUDIT_UW_RULES_ACC: String = "DFA_Final_Audit_UW_Rules_ACC"

  construct() {
    addSymbol(PARAM_DFA_AUDIT_UW_RULES_ACC, DelegateFinancialAuthority_ACC, \evalContext ->
      new DelegateFinancialAuthority_ACC(evalContext.Period)
    )
  }

  override property get Key(): RuleContextDefinitionKey {
    return RuleContextDefinitionKey.TC_DFAAUDITCHANGE_ACC
  }

  override function appliesToPolicyLines(lines: PolicyLine[]): boolean {
    return lines.HasElements and lines.allMatch(\line ->
        line == PolicyLine.TC_EMPWPCLINE or
        line == PolicyLine.TC_CWPSLINE)
  }

}