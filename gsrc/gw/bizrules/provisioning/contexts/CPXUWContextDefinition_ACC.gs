package gw.bizrules.provisioning.contexts
uses gw.pl.currency.MonetaryAmount
uses typekey.*

@Export
class CPXUWContextDefinition_ACC extends GenericUWRuleContextDefinition {
  public static final var PARAM_CPX_INFO_NEEDS_APPROVAL: String = "cpxInfoCov_ACC_Needs_Approval"
  public static final var PARAM_CPX_INFO_COV_ALC: String = "cpxInfoCov_ACC_ALC"
  public static final var PARAM_CPX_INFO_COV_ALC_FOR_APPROVAL: String = "cpxInfoCov_ACC_ALC_For_Approval"
  public static final var PARAM_CPX_INFO_COV_ALC_CHANGED: String = "cpxInfoCov_ACC_ALC_Changed"
  public static final var PARAM_CPX_INFO_COV_MCP: String = "cpxInfoCov_ACC_MCP"
  public static final var PARAM_CPX_INFO_COV_MCP_CHANGED: String = "cpxInfoCov_ACC_MCP_Changed"
  public static final var PARAM_CPX_INFO_COV_ALC_OR_MCP_CHANGED: String = "cpxInfoCov_ACC_ALC_OR_MCP_Changed"

  construct() {
    addSymbol(PARAM_CPX_INFO_NEEDS_APPROVAL, Boolean, \ec -> ec.Period.INDCPXLine.INDCPXCovs.first().getOptionalALCForApproval().Present)
    addSymbol(PARAM_CPX_INFO_COV_ALC_FOR_APPROVAL, MonetaryAmount, \ec -> ec.Period.INDCPXLine.INDCPXCovs.first().getALCForApproval())
    addSymbol(PARAM_CPX_INFO_COV_ALC, MonetaryAmount, \ec -> ec.Period.INDCPXLine.INDCPXCovs.first().getChangedALC())
    addSymbol(PARAM_CPX_INFO_COV_ALC_CHANGED, Boolean, \ec -> ec.Period.INDCPXLine.INDCPXCovs.first().getOptionalChangedALC().Present)
    addSymbol(PARAM_CPX_INFO_COV_MCP, MonetaryAmount, \ec -> ec.Period.INDCPXLine.INDCPXCovs.first().getChangedMCP())
    addSymbol(PARAM_CPX_INFO_COV_MCP_CHANGED, Boolean, \ec -> ec.Period.INDCPXLine.INDCPXCovs.first().getOptionalChangedMCP().Present)
    addSymbol(PARAM_CPX_INFO_COV_ALC_OR_MCP_CHANGED, Boolean, \ec -> ec.Period.INDCPXLine.INDCPXCovs.first().hasALCOrMCPChanged())
  }

  override property get Key(): RuleContextDefinitionKey {
    return RuleContextDefinitionKey.TC_INDCPXPOLICY_ACC
  }

  override function appliesToPolicyLines(lines: typekey.PolicyLine[]): boolean {
    return lines.HasElements and lines.allMatch(\line -> line == typekey.PolicyLine.TC_INDCPXLINE)
  }

}