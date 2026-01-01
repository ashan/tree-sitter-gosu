package nz.co.acc.lob.shc
uses gw.coverage.ExclusionAdapterBase
uses gw.api.util.JurisdictionMappingUtil

@Export
class CWPSLineExclExclusionAdapter extends ExclusionAdapterBase {
  var _owner: entity.CWPSLineExcl

  construct(owner: entity.CWPSLineExcl) {
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

  override function addToExclusionArray( p0: Exclusion ): void {
    _owner.CWPSLine.addToSHCLineExclusions( p0 as CWPSLineExcl )
  }

  override function removeFromParent(): void {
    _owner.CWPSLine.removeFromSHCLineExclusions( _owner )
  }

}