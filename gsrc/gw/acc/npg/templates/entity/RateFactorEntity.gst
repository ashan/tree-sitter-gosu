<% uses gw.acc.npg.model.RateFactor %>
<%@ params(rateFactor:RateFactor) %>
<?xml version="1.0"?>
<entity
  xmlns="http://guidewire.com/datamodel"
  entity="${rateFactor.EntityName}"
  type="effdated"
  desc="A rate factor is a risk characteristic and its associated numeric value which might have an impact on premium. As used here rate factors are applied to base premium rather than rates. A common example of Rate Factors are the components of IRPM (individual risk premium modifier)."
  effDatedBranchType="PolicyPeriod"
  exportable="true"
  extendable="true"
  loadable="false"
  table="${rateFactor.TableName}">
  <implementsEntity
    name="RateFactor"/>
  <implementsInterface
    iface="gw.api.domain.RateFactorAdapter"
    impl="${rateFactor.LOBPackageName}.${rateFactor.RateFactorAdapterImplName}"/>
  <implementsInterface
    iface="gw.api.copier.EffDatedCopyable"
    impl="gw.api.copier.EffDatedCopier"/>
  <implementsInterface
    iface="gw.api.logicalmatch.EffDatedLogicalMatcher"
    impl="${rateFactor.LOBPackageName}.${rateFactor.RateFactorMatcherImplName}"/>
${EntityColumn.renderToString(rateFactor.ModifierFkField)}
</entity>
