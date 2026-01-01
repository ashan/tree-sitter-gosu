package nz.co.acc.lob.aep

uses gw.api.domain.CoverableAdapter
uses java.util.Date
uses java.util.HashSet
uses gw.policy.PolicyLineConfiguration

@Export
class AEPLineCoverableAdapter implements CoverableAdapter {

  var _owner: entity.AEPLine_ACC

  construct(owner: entity.AEPLine_ACC) {
    _owner = owner
  }

  override property get PolicyLine(): PolicyLine {
    return _owner
  }

  override property get State(): Jurisdiction {
    return _owner.BaseState
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

  override property get PolicyLocations(): PolicyLocation[] {
    var locs = new HashSet<PolicyLocation>()
    return locs.toTypedArray()
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

  override property get DefaultCurrency(): Currency {
    return _owner.Branch.PreferredCoverageCurrency
  }

  override property get AllowedCurrencies(): List<Currency> {
    return PolicyLineConfiguration.getByLine(InstalledPolicyLine.TC_AEP).AllowedCurrencies
  }

  override property get AssociatedCoveragePartTypes() : CoveragePartType[] {
    return {}
  }
}