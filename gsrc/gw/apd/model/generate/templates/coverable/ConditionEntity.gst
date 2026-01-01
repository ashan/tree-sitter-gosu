<%@ params(coverable : APDCoverable, helper : ClauseEntityHelper) %>
<%
uses gw.apd.model.generate.ClauseEntityHelper
uses gw.apd.util.APDStringUtil
uses org.apache.commons.lang.StringEscapeUtils

var extPackage = coverable.LOBPackageName
%>
<?xml version="1.0"?>
<entity
  xmlns="http://guidewire.com/datamodel"
  entity="${coverable.QualifiedName}Cond"
  type="effdated"
  desc="Condition for ${StringEscapeUtils.escapeXml(coverable.Name)}"
  effDatedBranchType="PolicyPeriod"
  exportable="true"
  final="false"
  platform="false"
  loadable="false"
  table="${ APDStringUtil.makeTableName(coverable.QualifiedName.toLowerCase(), "cond")}">
  <implementsEntity
    name="PolicyCondition"/>
  <implementsInterface
    iface="gw.api.domain.PolicyConditionAdapter"
    impl="${extPackage}.${coverable.QualifiedName}ConditionAdapter"/>
  <implementsInterface
    iface="gw.api.logicalmatch.EffDatedLogicalMatcher"
    impl="${extPackage}.${coverable.QualifiedName}CondMatcher"/>
${ClauseDelegate.renderToString(coverable, helper)}
</entity>
