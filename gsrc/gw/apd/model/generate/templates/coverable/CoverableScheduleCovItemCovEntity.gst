<%@ params(coverable : APDCoverable) %>
<%
uses gw.apd.util.APDStringUtil

var extPackage = coverable.LOBPackageName
%>
<?xml version="1.0"?>
<entity
  effDatedBranchType="PolicyPeriod"
  loadable="false"
  xmlns="http://guidewire.com/datamodel"
  entity="${coverable.QualifiedName}SchCovItemCov"
  desc="${coverable.QualifiedName} coverage scheduled item with coverage terms"
  table="${APDStringUtil.makeTableName(coverable.QualifiedName.toLowerCase(), "schcovitemcov")}"
  type="effdated"
  exportable="true"
  final="false">
  <implementsEntity
    name="Coverage"/>
  <implementsInterface
    iface="gw.api.domain.CoverageAdapter"
    impl="${extPackage}.${coverable.QualifiedName}SchCovItemCovCoverageAdapter"/>
  <implementsEntity
    name="ScheduledItemClause"/>
  <implementsInterface
    iface="gw.api.logicalmatch.EffDatedLogicalMatcher"
    impl="${extPackage}.${coverable.QualifiedName}SchCovItemCovMatcher"/>
  <implementsInterface
    iface="gw.api.copier.EffDatedCopyable"
    impl="gw.api.copier.EffDatedCopier"/>
  <foreignkey
    fkentity="${coverable.QualifiedName}ScheduleCovItem"
    name="${coverable.ScheduleCovItemFieldName}"
    nullok="false"/>
</entity>