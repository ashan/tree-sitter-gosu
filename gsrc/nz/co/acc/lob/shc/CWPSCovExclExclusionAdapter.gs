package nz.co.acc.lob.shc
uses gw.coverage.ExclusionAdapterBase
uses gw.api.util.JurisdictionMappingUtil

@Export
class CWPSCovExclExclusionAdapter extends ExclusionAdapterBase {
  var _owner: entity.CWPSCovExcl

  construct(owner: entity.CWPSCovExcl) {
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

  override function addToExclusionArray( p0: Exclusion ): void {
    _owner.CWPSCov.addToExclusions( p0 as CWPSCovExcl )
  }

  override function removeFromParent(): void {
    _owner.CWPSCov.removeFromExclusions( _owner )
  }

}