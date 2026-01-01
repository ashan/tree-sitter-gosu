<%@ params(coverable : APDCoverable) %>
<%
uses gw.apd.util.APDStringUtil
var extPackage = coverable.LOBPackageName
%>
<?xml version="1.0"?>
<entity
  effDatedBranchType="PolicyPeriod"
  exportable="true"
  final="false"
  loadable="false"
  xmlns="http://guidewire.com/datamodel"
  entity="${coverable.QualifiedName}ScheduleCovItem"
  table="${APDStringUtil.makeTableName(coverable.QualifiedName.toLowerCase(), "schdcovitem")}"
  type="effdated">
  <implementsEntity
    name="${coverable.LinePrefix}ScheduledItem"/>
  <implementsEntity
    name="ScheduledItem"/>
<implementsInterface
  iface="gw.api.productmodel.ScheduledItemAdapter"
  impl="${extPackage}.${coverable.QualifiedName}ScheduleCovItemCoverableAdapter"/>
<implementsEntity
  name="Coverable"/>
<implementsInterface
  iface="gw.api.domain.CoverableAdapter"
  impl="${extPackage}.${coverable.QualifiedName}ScheduleCovItemCoverableAdapter"/>
<implementsInterface
  iface="gw.api.logicalmatch.EffDatedLogicalMatcher"
  impl="${extPackage}.${coverable.QualifiedName}ScheduleCovItemMatcher"/>
<implementsInterface
  iface="gw.api.copier.EffDatedCopyable"
  impl="gw.api.copier.EffDatedCopier"/>
<foreignkey
  fkentity="${coverable.QualifiedName}ScheduleCov"
  name="Schedule"
  nullok="false"/>
<onetoone
  cascadeDelete="true"
  desc="The coverage that applies to this scheduled item"
  fkentity="${coverable.QualifiedName}SchCovItemCov"
  name="ScheduledItemClause"
  nullok="true"/>
</entity>