package nz.co.acc.lob.ind

uses gw.api.domain.CoverableAdapter
uses java.util.Date
uses java.util.HashSet
uses gw.policy.PolicyLineConfiguration
uses gw.api.util.JurisdictionMappingUtil

@Export
class INDCoPLineCoverableAdapter implements CoverableAdapter {

  var _owner: entity.INDCoPLine

  construct(owner: entity.INDCoPLine) {
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
    _owner.addToINDLineCoverages( p0 as INDCoPLineCov )
  }

  override function removeCoverage( p0: Coverage ): void {
    _owner.removeFromINDLineCoverages( p0 as INDCoPLineCov )
  }

  override property get CoveragesFromCoverable(): Coverage[] {
    return _owner.INDLineCoverages
  }

  override property get ExclusionsFromCoverable(): Exclusion[] {
    return new Exclusion[0]
  }

  override function addExclusion( p0: Exclusion ): void {
    _owner.addToINDLineExclusions( p0 as INDCoPLineExcl )
  }

  override function removeExclusion( p0: Exclusion ): void {
    _owner.removeFromINDLineExclusions( p0 as INDCoPLineExcl )
  }

  override property get ConditionsFromCoverable(): PolicyCondition[] {
    return new PolicyCondition[0]
  }

  override function addCondition( p0: PolicyCondition ): void {
    _owner.addToINDLineConditions( p0 as INDCoPLineCond )
  }

  override function removeCondition( p0: PolicyCondition ): void {
    _owner.removeFromINDLineConditions( p0 as INDCoPLineCond )
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