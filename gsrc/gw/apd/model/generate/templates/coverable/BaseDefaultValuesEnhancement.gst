<%@ params(linePrefix : String, qualifiedName : String) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${linePrefix.toLowerCase()}"
%>
package ${basePackage}

uses gw.api.productedition.APDDefaultValueRulesHelper
uses gw.web.productmodel.DataModelSyncIssueWrapper

enhancement ${qualifiedName}DefaultValuesEnhancement : entity.${qualifiedName} {

  function setDefaultValuesUsingRules() {
    this.SyncableFields.forEach(\field -> APDDefaultValueRulesHelper.setDefaultValueUsingRules(this.PolicyLine, this, field))
  }

  function initializeDefaultValuesAndSync() {
    setDefaultValuesUsingRules()
    this.syncFields()
        .map(\issue -> DataModelSyncIssueWrapper.wrapIssue(issue))
        .fixDuringNormalSync(this)
  }

}