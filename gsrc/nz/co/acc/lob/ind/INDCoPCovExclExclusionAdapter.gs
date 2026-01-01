package nz.co.acc.lob.ind
uses gw.coverage.ExclusionAdapterBase
uses gw.api.util.JurisdictionMappingUtil

@Export
class INDCoPCovExclExclusionAdapter extends ExclusionAdapterBase {
  var _owner: entity.INDCoPCovExcl

  construct(owner: entity.INDCoPCovExcl) {
    super(owner)
    _owner = owner
  }

  override property get CoverageState(): Jurisdiction {
    return _owner.INDCoPCov.INDCoPLine.BaseState
  }

  override property get PolicyLine(): PolicyLine {
    return _owner.INDCoPCov.INDCoPLine
  }

  override property get OwningCoverable(): Coverable {
    return _owner.INDCoPCov
  }

  override function addToExclusionArray( p0: Exclusion ): void {
    _owner.INDCoPCov.addToExclusions( p0 as INDCoPCovExcl )
  }

  override function removeFromParent(): void {
    _owner.INDCoPCov.removeFromExclusions( _owner )
  }

}