package nz.co.acc.lob.shc
uses gw.coverage.ConditionAdapterBase
uses gw.api.util.JurisdictionMappingUtil

@Export
class CWPSCovCondConditionAdapter extends ConditionAdapterBase {
  var _owner: entity.CWPSCovCond

  construct(owner: entity.CWPSCovCond) {
    super(owner)
    _owner = owner
  }

  override property get CoverageState(): Jurisdiction {
    return _owner.CWPSCov.CWPSLine.BaseState
  }

  override property get PolicyLine(): PolicyLine {
    return _owner.CWPSCov.CWPSLine
  }

  override property get OwningCoverable(): Coverable {
    return _owner.CWPSCov
  }

  override function addToConditionArray( p0: PolicyCondition ): void {
    _owner.CWPSCov.addToConditions( p0 as CWPSCovCond )
  }

  override function removeFromParent(): void {
    _owner.CWPSCov.removeFromConditions( _owner )
  }

}