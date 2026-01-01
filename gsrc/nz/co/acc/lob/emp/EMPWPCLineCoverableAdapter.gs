package nz.co.acc.lob.emp

uses gw.api.domain.CoverableAdapter
uses java.util.Date
uses java.util.HashSet
uses gw.policy.PolicyLineConfiguration
uses gw.api.util.JurisdictionMappingUtil

@Export
class EMPWPCLineCoverableAdapter implements CoverableAdapter {

  var _owner: entity.EMPWPCLine

  construct(owner: entity.EMPWPCLine) {
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
    _owner.addToEMPLineCoverages( p0 as EMPWPCLineCov )
  }

  override function removeCoverage( p0: Coverage ): void {
    _owner.removeFromEMPLineCoverages( p0 as EMPWPCLineCov )
  }

  override property get CoveragesFromCoverable(): Coverage[] {
    return _owner.EMPLineCoverages
  }

  override property get ExclusionsFromCoverable() : Exclusion[] {
    return new Exclusion[] {}
  }

  override function addExclusion( p0: Exclusion ) : void {
    // do nothing
  }

  override function removeExclusion( p0: Exclusion ) : void {
    // do nothing
  }

  override property get ConditionsFromCoverable() : PolicyCondition[] {
    return new PolicyCondition[] {}
  }

  override function addCondition( p0: PolicyCondition ) : void {
    // do nothing
  }

  override function removeCondition( p0: PolicyCondition ) : void {
    // do nothing
  }

  override property get DefaultCurrency(): Currency {
    return _owner.Branch.PreferredCoverageCurrency
  }

  override property get AllowedCurrencies(): List<Currency> {
    return PolicyLineConfiguration.getByLine(InstalledPolicyLine.TC_EMP).AllowedCurrencies
  }

  override property get AssociatedCoveragePartTypes() : CoveragePartType[] {
    return {}
  }
}