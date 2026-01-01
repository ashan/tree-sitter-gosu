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
  entity="${coverable.QualifiedName}Cov"
  type="effdated"
  desc="Coverage for ${StringEscapeUtils.escapeXml(coverable.Name)}"
  effDatedBranchType="PolicyPeriod"
  exportable="true"
  final="false"
  platform="false"
  loadable="false"
  table="${ APDStringUtil.makeTableName(coverable.QualifiedName.toLowerCase(), "cov")}">
  <implementsEntity
    name="Coverage"/>
  <implementsInterface
    iface="gw.api.domain.CoverageAdapter"
    impl="${extPackage}.${coverable.QualifiedName}CoverageAdapter"/>
  <implementsInterface
    iface="gw.api.logicalmatch.EffDatedLogicalMatcher"
    impl="${extPackage}.${coverable.QualifiedName}CovMatcher"/>
${ClauseDelegate.renderToString(coverable, helper)}
</entity>
