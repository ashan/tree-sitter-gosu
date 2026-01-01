package nz.co.acc.lob.shc

uses gw.api.domain.CoverableAdapter
uses java.util.Date
uses java.util.HashSet
uses gw.policy.PolicyLineConfiguration
uses gw.api.util.JurisdictionMappingUtil

@Export
class CWPSLineCoverableAdapter implements CoverableAdapter {

  var _owner: entity.CWPSLine

  construct(owner: entity.CWPSLine) {
    _owner = owner
  }

  override property get PolicyLine(): PolicyLine {
    return _owner
  }

  override property get State(): Jurisdiction {
    return _owner.BaseState
  }

  override property get PolicyLocations(): PolicyLocation[] {
    var locs = new HashSet<PolicyLocation>()
    return locs.toTypedArray()
  }

  override function addCoverage( p0: Coverage ): void {
    _owner.addToSHCLineCoverages( p0 as CWPSLineCov )
  }

  override function removeCoverage( p0: Coverage ): void {
    _owner.removeFromSHCLineCoverages( p0 as CWPSLineCov )
  }

  override property get CoveragesFromCoverable(): Coverage[] {
    return _owner.SHCLineCoverages
  }

  override property get ExclusionsFromCoverable(): Exclusion[] {
    return new Exclusion[0]
  }

  override function addExclusion( p0: Exclusion ): void {
    _owner.addToSHCLineExclusions( p0 as CWPSLineExcl )
  }

  override function removeExclusion( p0: Exclusion ): void {
    _owner.removeFromSHCLineExclusions( p0 as CWPSLineExcl )
  }

  override property get ConditionsFromCoverable(): PolicyCondition[] {
    return new PolicyCondition[0]
  }

  override function addCondition( p0: PolicyCondition ): void {
    _owner.addToSHCLineConditions( p0 as CWPSLineCond )
  }

  override function removeCondition( p0: PolicyCondition ): void {
    _owner.removeFromSHCLineConditions( p0 as CWPSLineCond )
  }

  override property get DefaultCurrency(): Currency {
    return _owner.Branch.PreferredCoverageCurrency
  }

  override property get AllowedCurrencies(): List<Currency> {
    return PolicyLineConfiguration.getByLine(InstalledPolicyLine.TC_SHC).AllowedCurrencies
  }

  override property get AssociatedCoveragePartTypes() : CoveragePartType[] {
    return {}
  }
}