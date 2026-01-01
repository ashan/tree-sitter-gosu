package gw.apd

uses gw.api.domain.CoverableAdapter
uses gw.api.util.JurisdictionMappingUtil
uses entity.PolicyLine
uses typekey.Currency
uses entity.APDRiskCoverable

@Export
class APDRiskCoverableAdapter implements CoverableAdapter {
  var _owner : APDRiskCoverable

  construct(owner : APDRiskCoverable) {
    _owner = owner
  }

  override property get State(): Jurisdiction {
    switch (_owner.Coverable.RiskLocation) {
      case APDRiskLocationType.TC_USEPARENT : return _owner.Parent != null ? _owner.Parent.CoverableState : _owner.Branch.BaseState
      case APDRiskLocationType.TC_REFLOCATION : return JurisdictionMappingUtil.getJurisdiction(_owner.RiskFields.firstWhere(\rf -> rf.Attribute.Jurisdiction).Location)
      case APDRiskLocationType.TC_ISLOCATION : return JurisdictionMappingUtil.getJurisdiction(_owner.Location)
      case APDRiskLocationType.TC_ISBUILDING : return JurisdictionMappingUtil.getJurisdiction(_owner.Building.PolicyLocation)
    }
    return null
  }

  override function addCoverage(coverage: Coverage) {

  }

  override function removeCoverage(coverage: Coverage) {

  }

  override function addExclusion(exclusion: Exclusion) {

  }

  override function removeExclusion(exclusion: Exclusion) {

  }

  override function addCondition(policyCondition: PolicyCondition) {

  }

  override function removeCondition(policyCondition: PolicyCondition) {

  }

  override property get DefaultCurrency(): Currency {
    return _owner.Branch.PreferredCoverageCurrency
  }

  override property get AllowedCurrencies(): List<Currency> {
    return Currency.AllTypeKeys
  }

  override property get PolicyLine(): PolicyLine {
    return _owner.ManualPolicyLine
  }

  override property get PolicyLocations(): PolicyLocation[] {
    var locations = new HashSet<PolicyLocation>()
    // add the location used by this coverable
    switch (_owner.Coverable.RiskLocation) {
      case APDRiskLocationType.TC_USEPARENT :
        if (_owner.Parent == null) locations.add(_owner.Branch.PrimaryLocation)
        else locations.addAll(_owner.Parent.PolicyLocations.toList())
        break
      case APDRiskLocationType.TC_REFLOCATION :
        locations.add(_owner.RiskFields.firstWhere(\rf -> rf.Attribute.Jurisdiction).Location)
        break
      case APDRiskLocationType.TC_ISLOCATION :
        locations.add(_owner.Location)
        break
      case APDRiskLocationType.TC_ISBUILDING :
        locations.add(_owner.Building.PolicyLocation)
        break
    }
    // add all child locations
    locations.addAll(_owner.ManualPolicyLine.RiskCoverables.where(\rc -> rc.Parent == _owner)*.PolicyLocations.toSet())
    return locations.toTypedArray()
  }

  override property get CoveragesFromCoverable(): Coverage[] {
    return new Coverage[0]
  }

  override property get ExclusionsFromCoverable(): Exclusion[] {
    return new Exclusion[0]
  }

  override property get ConditionsFromCoverable(): PolicyCondition[] {
    return new PolicyCondition[0]
  }

  override property get AssociatedCoveragePartTypes() : CoveragePartType[] {
    return {}
  }
}