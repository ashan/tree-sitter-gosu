package nz.co.acc.lob.cpx

uses gw.api.domain.CoverableAdapter
uses java.util.Date
uses java.util.HashSet
uses gw.policy.PolicyLineConfiguration
uses gw.api.util.JurisdictionMappingUtil

@Export
class INDCPXCovCoverableAdapter implements CoverableAdapter {

  var _owner: entity.INDCPXCov

  construct(owner: entity.INDCPXCov) {
    _owner = owner
  }

  override property get PolicyLine(): PolicyLine {
    return _owner.INDCPXLine
  }

  override property get State(): Jurisdiction {
    return _owner.INDCPXLine.BaseState
  }

  override property get PolicyLocations(): PolicyLocation[] {
    return null
  }

  override function addCoverage( p0: Coverage ): void {
    _owner.addToCoverages( p0 as INDCPXCovCov )
  }

  override function removeCoverage( p0: Coverage ): void {
    _owner.removeFromCoverages( p0 as INDCPXCovCov )
  }

  override property get CoveragesFromCoverable(): Coverage[] {
    return _owner.Coverages
  }

  override property get ExclusionsFromCoverable(): Exclusion[] {
    return new Exclusion[0]
  }

  override function addExclusion( p0: Exclusion ): void {
    _owner.addToExclusions( p0 as INDCPXCovExcl )
  }

  override function removeExclusion( p0: Exclusion ): void {
    _owner.removeFromExclusions( p0 as INDCPXCovExcl )
  }

  override property get ConditionsFromCoverable(): PolicyCondition[] {
    return new PolicyCondition[0]
  }

  override function addCondition( p0: PolicyCondition ): void {
    _owner.addToConditions( p0 as INDCPXCovCond )
  }

  override function removeCondition( p0: PolicyCondition ): void {
    _owner.removeFromConditions( p0 as INDCPXCovCond )
  }

  override property get DefaultCurrency(): Currency {
    return _owner.Branch.PreferredCoverageCurrency
  }

  override property get AllowedCurrencies(): List<Currency> {
    return PolicyLineConfiguration.getByLine(InstalledPolicyLine.TC_CPX).AllowedCurrencies
  }

  override property get AssociatedCoveragePartTypes() : CoveragePartType[] {
    return {}
  }
}