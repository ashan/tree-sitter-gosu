package nz.co.acc.lob.cpx

uses gw.api.domain.CoverableAdapter
uses java.util.Date
uses java.util.HashSet
uses gw.policy.PolicyLineConfiguration
uses gw.api.util.JurisdictionMappingUtil

@Export
class INDCPXLineCoverableAdapter implements CoverableAdapter {

  var _owner: entity.INDCPXLine

  construct(owner: entity.INDCPXLine) {
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
    _owner.addToCPXLineCoverages( p0 as INDCPXLineCov )
  }

  override function removeCoverage( p0: Coverage ): void {
    _owner.removeFromCPXLineCoverages( p0 as INDCPXLineCov )
  }

  override property get CoveragesFromCoverable(): Coverage[] {
    return _owner.CPXLineCoverages
  }

  override property get ExclusionsFromCoverable(): Exclusion[] {
    return new Exclusion[0]
  }

  override function addExclusion( p0: Exclusion ): void {
    _owner.addToCPXLineExclusions( p0 as INDCPXLineExcl )
  }

  override function removeExclusion( p0: Exclusion ): void {
    _owner.removeFromCPXLineExclusions( p0 as INDCPXLineExcl )
  }

  override property get ConditionsFromCoverable(): PolicyCondition[] {
    return new PolicyCondition[0]
  }

  override function addCondition( p0: PolicyCondition ): void {
    _owner.addToCPXLineConditions( p0 as INDCPXLineCond )
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

  override function removeCondition(condition : PolicyCondition) {
    _owner.removeFromCPXLineConditions( condition as INDCPXLineCond)
  }
}