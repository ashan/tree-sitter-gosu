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
  entity="${coverable.LinePrefix}${coverable.TypeName}Excl"
  type="effdated"
  desc="Exclusion for ${StringEscapeUtils.escapeXml(coverable.Name)}"
  effDatedBranchType="PolicyPeriod"
  exportable="true"
  final="false"
  platform="false"
  loadable="false"
  table="${ APDStringUtil.makeTableName(coverable.QualifiedName.toLowerCase(), "excl")}">
  <implementsEntity
    name="Exclusion"/>
  <implementsInterface
    iface="gw.api.domain.ExclusionAdapter"
    impl="${extPackage}.${coverable.QualifiedName}ExclusionAdapter"/>
  <implementsInterface
    iface="gw.api.logicalmatch.EffDatedLogicalMatcher"
    impl="${extPackage}.${coverable.QualifiedName}ExclMatcher"/>
${ClauseDelegate.renderToString(coverable, helper)}
</entity>
