<% uses gw.acc.npg.model.Modifier %>
<%@ params( modifier: Modifier ) %>
<?xml version="1.0"?>
<entity
  xmlns="http://guidewire.com/datamodel"
  entity="${modifier.EntityName}"
  type="effdated"
  desc="${modifier.Description}"
  effDatedBranchType="PolicyPeriod"
  exportable="true"
  extendable="true"
  final="false"
  loadable="false"
  table="${modifier.TableName}">
  <implementsEntity
    name="Modifier"/>
  <implementsInterface
    iface="gw.api.domain.ModifierAdapter"
    impl="${modifier.LOBPackageName}.${modifier.ModifierAdapterImplName}"/>
  <implementsInterface
    iface="gw.api.copier.EffDatedCopyable"
    impl="gw.api.copier.EffDatedCopier"/>
  <implementsInterface
    iface="gw.api.logicalmatch.EffDatedLogicalMatcher"
    impl="${modifier.LOBPackageName}.${modifier.ModifierMatcherImplName}"/>
${EntityColumn.renderToString(modifier.FkFieldToCoverable)}
${EntityColumn.renderToString(modifier.RateFactorArrayField)}
</entity>
