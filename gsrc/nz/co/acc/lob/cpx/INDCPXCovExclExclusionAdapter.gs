package nz.co.acc.lob.cpx
uses gw.coverage.ExclusionAdapterBase
uses gw.api.util.JurisdictionMappingUtil

@Export
class INDCPXCovExclExclusionAdapter extends ExclusionAdapterBase {
  var _owner: entity.INDCPXCovExcl

  construct(owner: entity.INDCPXCovExcl) {
    super(owner)
    _owner = owner
  }

  override property get CoverageState(): Jurisdiction {
    return _owner.INDCPXCov.INDCPXLine.BaseState
  }

  override property get PolicyLine(): PolicyLine {
    return _owner.INDCPXCov.INDCPXLine
  }

  override property get OwningCoverable(): Coverable {
    return _owner.INDCPXCov
  }

  override function addToExclusionArray( p0: Exclusion ): void {
    _owner.INDCPXCov.addToExclusions( p0 as INDCPXCovExcl )
  }

  override function removeFromParent(): void {
    _owner.INDCPXCov.removeFromExclusions( _owner )
  }

}