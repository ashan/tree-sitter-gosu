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
  entity="${coverable.QualifiedName}SchCondItemCond"
  desc="${coverable.QualifiedName} condition scheduled item with condition terms"
  table="${APDStringUtil.makeTableName(coverable.QualifiedName.toLowerCase(), "schconditemcond")}"
  type="effdated"
  exportable="true"
  final="false">
  <implementsEntity
    name="PolicyCondition"/>
  <implementsInterface
    iface="gw.api.domain.PolicyConditionAdapter"
    impl="${extPackage}.${coverable.QualifiedName}SchCondItemCondConditionAdapter"/>
  <implementsEntity
    name="ScheduledItemClause"/>
  <implementsInterface
    iface="gw.api.logicalmatch.EffDatedLogicalMatcher"
    impl="${extPackage}.${coverable.QualifiedName}SchCondItemCondMatcher"/>
  <implementsInterface
    iface="gw.api.copier.EffDatedCopyable"
    impl="gw.api.copier.EffDatedCopier"/>
  <foreignkey
    fkentity="${coverable.QualifiedName}ScheduleCondItem"
    name="${coverable.ScheduleCondItemFieldName}"
    nullok="false"/>
</entity>