<%
uses gw.apd.model.generate.templates.TemplateComparators
%>
<%@ params(coverable : APDCoverable) %>
<%
uses gw.apd.APDConstants
uses gw.apd.model.generate.APDGosuReferencesHelper

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}"
%>
package ${basePackage}

uses gw.api.domain.CoverableAdapter
uses java.util.Date
uses java.util.HashSet
uses gw.policy.PolicyLineConfiguration
uses gw.api.util.JurisdictionMappingUtil
uses java.lang.UnsupportedOperationException
uses gw.api.locale.DisplayKey

@Export
class ${coverable.QualifiedName}CoverableAdapterBase implements CoverableAdapter {

  var _owner : entity.${coverable.QualifiedName} as Owner

  construct(owner : entity.${coverable.QualifiedName}) {
    _owner = owner
  }

  override property get PolicyLine() : PolicyLine {
    return _owner${ APDGosuReferencesHelper.getReferenceToLine(coverable)}
  }

  override property get PolicyLocations() : PolicyLocation[] {
    var locs = new HashSet<PolicyLocation>()
<%if(coverable.RiskLocation == APDRiskLocationType.TC_ISLOCATION){%>
    locs.add(_owner.Location)
<%} else if(coverable.RiskLocation == APDRiskLocationType.TC_ISBUILDING){%>
    locs.add(_owner.Building.PolicyLocation)
<%}%>
<%var locationField = coverable.Fields.firstWhere(\f -> f.Jurisdiction)
  if (locationField != null) {%>
    locs.add(_owner.${locationField.Name})
<%}%>
<%for (exp in coverable.Exposures.where(\exp -> exp.RiskLocation != APDRiskLocationType.TC_USEPARENT).sort(TemplateComparators.ExposureOrdering)) {%>
    locs.addAll(_owner.${exp.QualifiedName}s*.${exp.Fields.firstWhere(\f -> f.Jurisdiction).Name}.toList())
<%}%>
<%for (cbl in coverable.ChildCoverables.where(\cc -> cc.IsACoverable).sort(TemplateComparators.CoverableOrdering)) { // TODO: deal with children that are not coverables%>
    locs.addAll(_owner.${cbl.QualifiedName}s*.PolicyLocations.toList())
<%}%>
    return locs.toTypedArray()
  }

  override property get State() : Jurisdiction {
<%if(coverable.RiskLocation == APDRiskLocationType.TC_ISLOCATION
  or coverable.RiskLocation == APDRiskLocationType.TC_ISBUILDING
  or coverable.RiskLocation == APDRiskLocationType.TC_REFLOCATION){%>
    return JurisdictionMappingUtil.getJurisdiction(_owner.${coverable.LocationField})
<%} else if(coverable.JurisdictionReferencesLocation){ // uses parent jurisdiction %>
    return JurisdictionMappingUtil.getJurisdiction(_owner${coverable.ReferenceToJurisdiction})
<%} else {%>
    return _owner${coverable.ReferenceToJurisdiction}
<%}%>
  }

<%if(coverable.Coverages.Count > 0){%>
  override function addCoverage(cov : Coverage) {
    _owner.addTo${coverable.LinePrefix}Coverages(cov as entity.${coverable.QualifiedName}Cov)
  }

  override function removeCoverage(cov : Coverage) {
    _owner.removeFrom${coverable.LinePrefix}Coverages(cov as entity.${coverable.QualifiedName}Cov)
  }

  override property get CoveragesFromCoverable() : Coverage[] {
    return _owner.${coverable.LinePrefix}Coverages
  }
<%} else {%>
  override function addCoverage(cov : Coverage) {
    throw new UnsupportedOperationException(DisplayKey.get("CoverableAdapter.Error.CoveragesNotImplemented"))
  }

  override function removeCoverage(cov : Coverage) {
    throw new UnsupportedOperationException(DisplayKey.get("CoverableAdapter.Error.CoveragesNotImplemented"))
  }

  override property get CoveragesFromCoverable() : Coverage[] {
    return new Coverage[] {}
  }
<%}%>

<%if(coverable.Exclusions.Count > 0){%>
  override function addExclusion(excl : Exclusion) {
    _owner.addTo${coverable.LinePrefix}Exclusions(excl as entity.${coverable.QualifiedName}Excl)
  }

  override function removeExclusion(excl : Exclusion) {
    _owner.removeFrom${coverable.LinePrefix}Exclusions(excl as entity.${coverable.QualifiedName}Excl)
  }

  override property get ExclusionsFromCoverable() : Exclusion[] {
    return _owner.${coverable.LinePrefix}Exclusions
  }
<%} else {%>
  override function addExclusion(excl : Exclusion) {
    throw new UnsupportedOperationException(DisplayKey.get("CoverableAdapter.Error.ExclusionsNotImplemented"))
  }

  override function removeExclusion(excl : Exclusion) {
    throw new UnsupportedOperationException(DisplayKey.get("CoverableAdapter.Error.ExclusionsNotImplemented"))
  }

  override property get ExclusionsFromCoverable() : Exclusion[] {
    return new Exclusion[] {}
  }
<%}%>

<%if(coverable.Conditions.Count > 0){%>
  override function addCondition(cond : PolicyCondition) {
    _owner.addTo${coverable.LinePrefix}Conditions(cond as entity.${coverable.QualifiedName}Cond)
  }

  override function removeCondition(cond : PolicyCondition) {
    _owner.removeFrom${coverable.LinePrefix}Conditions(cond as entity.${coverable.QualifiedName}Cond)
  }

  override property get ConditionsFromCoverable() : PolicyCondition[] {
    return _owner.${coverable.LinePrefix}Conditions
  }
<%} else {%>
  override function addCondition(cond : PolicyCondition) {
    throw new UnsupportedOperationException(DisplayKey.get("CoverableAdapter.Error.ConditionsNotImplemented"))
  }

  override function removeCondition(cond : PolicyCondition) {
    throw new UnsupportedOperationException(DisplayKey.get("CoverableAdapter.Error.ConditionsNotImplemented"))
  }

  override property get ConditionsFromCoverable() : PolicyCondition[] {
    return new PolicyCondition[] {}
  }
<%}%>

  override property get DefaultCurrency() : Currency {
    return _owner.Branch.PreferredCoverageCurrency
  }

  override property get AllowedCurrencies() : List<Currency> {
    return PolicyLineConfiguration.getByLine(InstalledPolicyLine.TC_${coverable.LinePrefix}).AllowedCurrencies
  }

  override property get AssociatedCoveragePartTypes() : CoveragePartType[] {
    return {}
  }

}