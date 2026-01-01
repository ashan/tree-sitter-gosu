package nz.co.acc.sampledata

uses gw.api.builder.UWRuleBuilder
uses gw.bizrules.databuilder.RuleConditionBuilder
uses gw.bizrules.provisioning.contexts.AuditOnHoldContextDefinition_ACC
uses gw.bizrules.provisioning.contexts.ReassessmentContextDefinition_ACC
uses gw.pl.persistence.core.Bundle
uses gw.sampledata.AbstractSampleDataCollection
uses typekey.*
uses typekey.PolicyLine
uses typekey.Job

/**
 * Sample UWIssue Rules
 */
@Export
class UWRuleData_ACC extends AbstractSampleDataCollection {
  construct() {

  }

  public override function load() {
      gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
        load(bundle)
        loadReassessmentUR(bundle)
      })
  }

  override property get CollectionName(): String {
    return "UW Rule Data"
  }

  public override property get AlreadyLoaded(): boolean {
      return UWIssueType.finder.findUWIssueTypeByCode(ReassessmentContextDefinition_ACC.CODE_PREVENT_REASSESSMENT) != null
  }

  private static function load(bundle: Bundle) {
    //CPX Rule 1: Raise an UW issue when Agreed labour cost <= Max cover permitted
    DefaultBuilder
        .withBlockingPoint(UWIssueBlockingPoint.TC_BLOCKSQUOTE)
        .withDefaultDurationType(TC_NEXTCHANGE)
        .withCode("AgreedLevelOfCover_LE_ACC")
        .withComparator(TC_MONETARY_LE)
        .withDefaultEditBeforeBind(true)
        .withDefaultValueAssignmentType(TC_FIXED)
        .withDescription("The agreed level of cover needs to be approved")
        .withName("CPX: Agreed Level of Cover needs approval")
        .withValueFormatter(TC_MONETARYAMOUNT)
        .withRuleContextDefinitionKey(RuleContextDefinitionKey.TC_INDCPXPOLICY_ACC)
        .withPolicyLine(TC_INDCPXLINE)
        .withRuleCondition(new RuleConditionBuilder()
            .addRuleConditionLine("cpxInfoCov_ACC_ALC", RuleOperator.TC_LESSTHANOREQUAL, "cpxInfoCov_ACC_MCP"))
        .withIssueKeyParam("cpxInfoCov_ACC_ALC")
        .withShortDescParam("Agreed Level of Cover needs approval", "en_US")
        .withLongDescParam("The Agreed Level of Cover needs to be approved.")
        .withValueParam("\${cpxInfoCov_ACC_ALC}")
        .withAvailableToRun(true)
        .create(bundle)

    //CPX Rule 2: Raise an UW issue when Agreed labour cost > Max cover permitted
    DefaultBuilder
        .withBlockingPoint(UWIssueBlockingPoint.TC_BLOCKSQUOTE)
        .withDefaultDurationType(TC_NEXTCHANGE)
        .withCode("AgreedLevelOfCover_GT_ACC")
        .withComparator(TC_MONETARY_LE)
        .withDefaultEditBeforeBind(true)
        .withDefaultValueAssignmentType(TC_FIXED)
        .withDescription("The agreed level of cover is above the maximum cover permitted")
        .withName("CPX: Agreed Level of Cover above maximum cover permitted")
        .withValueFormatter(TC_MONETARYAMOUNT)
        .withRuleContextDefinitionKey(RuleContextDefinitionKey.TC_INDCPXPOLICY_ACC)
        .withPolicyLine(TC_INDCPXLINE)
        .withRuleCondition(new RuleConditionBuilder()
            .addRuleConditionLine("cpxInfoCov_ACC_ALC", RuleOperator.TC_GREATERTHAN, "cpxInfoCov_ACC_MCP"))
        .withIssueKeyParam("cpxInfoCov_ACC_ALC")
        .withShortDescParam("Agreed Level of Cover is more than the Maximum Cover Permitted", "en_US")
        .withLongDescParam("The Agreed Level of Cover needs to be approved.")
        .withValueParam("\${cpxInfoCov_ACC_ALC}")
        .withAvailableToRun(true)
        .create(bundle)

    DefaultBuilder
        .withBlockingPoint(UWIssueBlockingPoint.TC_BLOCKSISSUANCE)
        .withDefaultDurationType(TC_NEXTCHANGE)
        .withTriggeringPointKey(TriggeringPointKey.TC_PREISSUANCE)
        .withCode("DelegatedFinancialAuthorityLimits_ACC")
        .withComparator(ValueComparator.TC_NUMERIC_LE)
        .withDefaultEditBeforeBind(true)
        .withDefaultValueAssignmentType(TC_FIXED)
        .withDescription("Delegated Financial Authority Limits")
        .withName("Delegated Financial Authority Limits")
        .withRuleContextDefinitionKey(RuleContextDefinitionKey.TC_DFAPOLICYCHANGE_ACC)
        .withPolicyLine(PolicyLine.TC_CWPSLINE)
        .withPolicyLine(PolicyLine.TC_EMPWPCLINE)
        .withPolicyLine(PolicyLine.TC_INDCOPLINE)
        .withPolicyLine(PolicyLine.TC_INDCPXLINE)
        .withPolicyTransaction(Job.TC_POLICYCHANGE)
        .withRuleCondition(new RuleConditionBuilder()
            .withRuleConditionType(RuleConditionType.TC_ALLAND)
            .addTrueFalseRuleConditionLine("DFA_UW_Rules_ACC.canAutoIssueWithoutDfa_ACC()", RuleOperator.TC_ISFALSE)
            .addHasValueRuleConditionLine("DFA_UW_Rules_ACC.PolicyChangeAmount", RuleOperator.TC_HASAVALUE))
        .withIssueKeyParam("BizRules.ValidateAll.ChangeAmount")
        .withShortDescParam("Change in cost outside DFA.", "en_US")
        .withLongDescParam("Change in Cost is outside user's Delegated Financial Authority.")
        .withValueParam("\${DFA_UW_Rules_ACC.PolicyChangeAmount}")
        .withValueFormatter(ValueFormatterType.TC_MONETARYAMOUNT)
        .withAvailableToRun(true)
        .create(bundle)

    DefaultBuilder
        .withBlockingPoint(UWIssueBlockingPoint.TC_BLOCKSAUDITISSUANCE_ACC)
        .withDefaultDurationType(TC_NEXTCHANGE)
        .withTriggeringPointKey(TriggeringPointKey.TC_PREFINALAUDIT_ACC)
        .withCode("FinalAuditDFALimits_ACC")
        .withComparator(ValueComparator.TC_NUMERIC_LE)
        .withDefaultEditBeforeBind(true)
        .withDefaultValueAssignmentType(TC_FIXED)
        .withDescription("Final Audit Delegated Financial Authority Limits")
        .withName("Final Audit Delegated Financial Authority Limits")
        .withRuleContextDefinitionKey(RuleContextDefinitionKey.TC_DFAAUDITCHANGE_ACC)
        .withPolicyLine(PolicyLine.TC_CWPSLINE)
        .withPolicyLine(PolicyLine.TC_EMPWPCLINE)
        .withPolicyTransaction(Job.TC_AUDIT)
        .withRuleCondition(new RuleConditionBuilder()
            .withRuleConditionType(RuleConditionType.TC_ALLAND)
            .addTrueFalseRuleConditionLine("DFA_Final_Audit_UW_Rules_ACC.canAutoIssueWithoutDfa_ACC()", RuleOperator.TC_ISFALSE)
            .addHasValueRuleConditionLine("DFA_Final_Audit_UW_Rules_ACC.PolicyChangeAmount", RuleOperator.TC_HASAVALUE))
        .withIssueKeyParam("BizRules.ValidateAll.ChangeAmount")
        .withShortDescParam("Change in cost outside DFA.", "en_US")
        .withLongDescParam("Change in Cost is outside user's Delegated Financial Authority.")
        .withValueParam("\${DFA_Final_Audit_UW_Rules_ACC.PolicyChangeAmount}")
        .withValueFormatter(ValueFormatterType.TC_MONETARYAMOUNT)
        .withAvailableToRun(true)
        .create(bundle)

    DefaultBuilder
        .withBlockingPoint(TC_BLOCKSQUOTERELEASE)
        .withTriggeringPointKey(TC_MANUAL)
        .withCode("UW1ReviewBlocksQuoteRelease")
        .withDescription("To be reviewed by underwriter 1, blocking quote release")
        .withName("To be reviewed by underwriter 1, blocking quote release").withRuleCondition(new RuleConditionBuilder()
        .addRuleConditionLine("1", RuleOperator.TC_EQUALS, "1"))
        .withShortDescParam("x.", "en_US")
        .withLongDescParam("x.")
        .create(bundle)

    DefaultBuilder
        .withBlockingPoint(TC_BLOCKSQUOTERELEASE)
        .withTriggeringPointKey(TC_MANUAL)
        .withCode("UW2ReviewBlocksQuoteRelease")
        .withDescription("To be reviewed by underwriter 2, blocking quote release")
        .withName("To be reviewed by underwriter 2, blocking quote release")
        .withRuleCondition(new RuleConditionBuilder()
            .addRuleConditionLine("1", RuleOperator.TC_EQUALS, "1"))
        .withShortDescParam("x.", "en_US")
        .withLongDescParam("x.")
        .create(bundle)

    DefaultBuilder
        .withBlockingPoint(TC_BLOCKSQUOTERELEASE)
        .withTriggeringPointKey(TC_MANUAL)
        .withCode("UWManagerReviewBlocksQuoteRelease")
        .withDescription("To be reviewed by underwriting manager, blocking quote release")
        .withName("To be reviewed by underwriting manager, blocking quote release")
        .withRuleCondition(new RuleConditionBuilder()
            .addRuleConditionLine("1", RuleOperator.TC_EQUALS, "1"))
        .withShortDescParam("x.", "en_US")
        .withLongDescParam("x.")
        .create(bundle)

    DefaultBuilder
        .withBlockingPoint(TC_BLOCKSQUOTERELEASE)
        .withTriggeringPointKey(TC_PREQUOTERELEASE)
        .withDefaultDurationType(TC_NEXTCHANGE)
        .withDescription("Quote has one or more manual overrides")
        .withName("Quote Has Manual Overrides")
        .create(bundle)
  }

  private static function loadReassessmentUR(bundle: Bundle) {
    //Prevents Reassessment UR - US2943
    DefaultBuilder
        .withBlockingPoint(UWIssueBlockingPoint.TC_BLOCKSQUOTE)
        .withPolicyTransaction(TC_POLICYCHANGE)
        .withTriggeringPointKey(TriggeringPointKey.TC_PREQUOTE)
        .withDefaultDurationType(UWApprovalDurationType.TC_NEXTCHANGE)
        .withPolicyLine(TC_EMPWPCLINE)
        .withPolicyLine(TC_CWPSLINE)
        .withPolicyLine(TC_INDCOPLINE)
        .withPolicyLine(TC_INDCPXLINE)
        .withCode(ReassessmentContextDefinition_ACC.CODE_PREVENT_REASSESSMENT)
        .withIssueKeyParam(ReassessmentContextDefinition_ACC.CODE_PREVENT_REASSESSMENT)
        .withDefaultEditBeforeBind(true)
        .withName("On Hold - Prevent Reassessment")
        .withDescription("Policy is on hold and is a migrated policy")
        .withRuleContextDefinitionKey(RuleContextDefinitionKey.TC_REASSESSMENT_ACC)
        .withLongDescParam("The policy is on hold and must be reviewed before it can be bound/issued")
        .withShortDescParam("Policy is on hold and is a migrated policy", "en_US")
        .withRuleCondition(new RuleConditionBuilder()
            .addTrueFalseRuleConditionLine(ReassessmentContextDefinition_ACC.PARAM_PREVENT_REASSESSMENT, RuleOperator.TC_ISTRUE))
        .withAvailableToRun(true)
        .create(bundle)

    //Prevents Reassessment UR - US3513
    DefaultBuilder
        .withBlockingPoint(UWIssueBlockingPoint.TC_BLOCKSQUOTE)
        .withPolicyTransaction(TC_AUDIT)
        .withTriggeringPointKey(TriggeringPointKey.TC_PREFINALAUDIT_ACC)
        .withDefaultDurationType(UWApprovalDurationType.TC_NEXTCHANGE)
        .withPolicyLine(TC_EMPWPCLINE)
        .withPolicyLine(TC_CWPSLINE)
        .withPolicyLine(TC_INDCOPLINE)
        .withPolicyLine(TC_INDCPXLINE)
        .withCode(AuditOnHoldContextDefinition_ACC.AUDIT_ON_HOLD_PREVENT_REASSESSMENT)
        .withIssueKeyParam(AuditOnHoldContextDefinition_ACC.AUDIT_ON_HOLD_PREVENT_REASSESSMENT)
        .withDefaultEditBeforeBind(true)
        .withName("On Hold - Prevent Audit")
        .withDescription("Audit Policy is on hold and is a migrated policy")
        .withRuleContextDefinitionKey(RuleContextDefinitionKey.TC_REASSESSMENT_ACC)
        .withLongDescParam("The policy is on hold and Audit must be reviewed before it can be Submitted")
        .withShortDescParam("Audit Policy is on hold and is a migrated policy", "en_US")
        .withRuleCondition(new RuleConditionBuilder()
            .addTrueFalseRuleConditionLine(ReassessmentContextDefinition_ACC.PARAM_PREVENT_REASSESSMENT, RuleOperator.TC_ISTRUE))
        .withAvailableToRun(true)
        .create(bundle)
  }

  private static property get DefaultBuilder(): UWRuleBuilder {
    return new UWRuleBuilder()
        .withTriggeringPointKey(TC_PREQUOTE)
        .withRuleContextDefinitionKey(TC_GENERICPOLICY)
        .withBlockingPoint(TC_BLOCKSBIND)
        .withAutoApprovable(true)
        .withDefaultApprovalBlockingPoint(TC_NONBLOCKING)
        .withDefaultDurationType(TC_RESCINDED)
        .withDefaultEditBeforeBind(false)
        .withComparator(TC_NONE)
        .withValueFormatter(TC_UNFORMATTED)
        .withRuleCondition(new RuleConditionBuilder().withRuleConditionType(TC_ALWAYSTRUE))
        .withAvailableToRun(false)
  }
}
