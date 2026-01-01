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
  entity="${coverable.QualifiedName}SchExclItemExcl"
  desc="${coverable.QualifiedName} exclusion scheduled item with exclusion terms"
  table="${APDStringUtil.makeTableName(coverable.QualifiedName.toLowerCase(), "schexclitemexcl")}"
  type="effdated"
  exportable="true"
  final="false">
  <implementsEntity
    name="Exclusion"/>
  <implementsInterface
    iface="gw.api.domain.ExclusionAdapter"
    impl="${extPackage}.${coverable.QualifiedName}SchExclItemExclExclusionAdapter"/>
  <implementsEntity
    name="ScheduledItemClause"/>
  <implementsInterface
    iface="gw.api.logicalmatch.EffDatedLogicalMatcher"
    impl="${extPackage}.${coverable.QualifiedName}SchExclItemExclMatcher"/>
  <implementsInterface
    iface="gw.api.copier.EffDatedCopyable"
    impl="gw.api.copier.EffDatedCopier"/>
  <foreignkey
    fkentity="${coverable.QualifiedName}ScheduleExclItem"
    name="${coverable.ScheduleExclItemFieldName}"
    nullok="false"/>
</entity>