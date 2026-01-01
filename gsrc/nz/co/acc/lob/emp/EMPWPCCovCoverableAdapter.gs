package nz.co.acc.lob.emp

uses gw.api.domain.CoverableAdapter
uses java.util.Date
uses java.util.HashSet
uses gw.policy.PolicyLineConfiguration
uses gw.api.util.JurisdictionMappingUtil

@Export
class EMPWPCCovCoverableAdapter implements CoverableAdapter {

  var _owner: entity.EMPWPCCov

  construct(owner: entity.EMPWPCCov) {
    _owner = owner
  }

  override property get PolicyLine(): PolicyLine {
    return _owner.EMPWPCLine
  }

  override property get State(): Jurisdiction {
    return _owner.EMPWPCLine.BaseState
  }

  override property get PolicyLocations(): PolicyLocation[] {
    return null
  }

  override function addCoverage( p0: Coverage ): void {
    _owner.addToCoverages( p0 as EMPWPCCovCov )
  }

  override function removeCoverage( p0: Coverage ): void {
    _owner.removeFromCoverages( p0 as EMPWPCCovCov )
  }

  override property get CoveragesFromCoverable(): Coverage[] {
    return _owner.Coverages
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