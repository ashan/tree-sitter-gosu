package nz.co.acc.lob.ind

uses gw.api.domain.CoverableAdapter
uses java.util.Date
uses java.util.HashSet
uses gw.policy.PolicyLineConfiguration
uses gw.api.util.JurisdictionMappingUtil

@Export
class INDCoPCovCoverableAdapter implements CoverableAdapter {

  var _owner: entity.INDCoPCov

  construct(owner: entity.INDCoPCov) {
    _owner = owner
  }

  override property get PolicyLine(): PolicyLine {
    return _owner.INDCoPLine
  }

  override property get State(): Jurisdiction {
    return _owner.INDCoPLine.BaseState
  }

  override property get PolicyLocations(): PolicyLocation[] {
    return null
  }

  override function addCoverage( p0: Coverage ): void {
    _owner.addToCoverages( p0 as INDCoPCovCov )
  }

  override function removeCoverage( p0: Coverage ): void {
    _owner.removeFromCoverages( p0 as INDCoPCovCov )
  }

  override property get CoveragesFromCoverable(): Coverage[] {
    return _owner.Coverages
  }

  override property get ExclusionsFromCoverable(): Exclusion[] {
    return new Exclusion[0]
  }

  override function addExclusion( p0: Exclusion ): void {
    _owner.addToExclusions( p0 as INDCoPCovExcl )
  }

  override function removeExclusion( p0: Exclusion ): void {
    _owner.removeFromExclusions( p0 as INDCoPCovExcl )
  }

  override property get ConditionsFromCoverable(): PolicyCondition[] {
    return new PolicyCondition[0]
  }

  override function addCondition( p0: PolicyCondition ): void {
    _owner.addToConditions( p0 as INDCoPCovCond )
  }

  override function removeCondition( p0: PolicyCondition ): void {
    _owner.removeFromConditions( p0 as INDCoPCovCond )
  }

  override property get DefaultCurrency(): Currency {
    return _owner.Branch.PreferredCoverageCurrency
  }

  override property get AllowedCurrencies(): List<Currency> {
    return PolicyLineConfiguration.getByLine(InstalledPolicyLine.TC_IND).AllowedCurrencies
  }

  override property get AssociatedCoveragePartTypes() : CoveragePartType[] {
    return {}
  }
}