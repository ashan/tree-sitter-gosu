package nz.co.acc.lob.shc
uses gw.coverage.ConditionAdapterBase
uses gw.api.util.JurisdictionMappingUtil

@Export
class CWPSLineCondConditionAdapter extends ConditionAdapterBase {
  var _owner: entity.CWPSLineCond

  construct(owner: entity.CWPSLineCond) {
    super(owner)
    _owner = owner
  }

  override property get CoverageState(): Jurisdiction {
    return _owner.CWPSLine.BaseState
  }

  override property get PolicyLine(): PolicyLine {
    return _owner.CWPSLine
  }

  override property get OwningCoverable(): Coverable {
    return _owner.CWPSLine
  }

  override function addToConditionArray( p0: PolicyCondition ): void {
    _owner.CWPSLine.addToSHCLineConditions( p0 as CWPSLineCond )
  }

  override function removeFromParent(): void {
    _owner.CWPSLine.removeFromSHCLineConditions( _owner )
  }

}