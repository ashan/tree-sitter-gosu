package nz.co.acc.lob.cpx
uses gw.coverage.ExclusionAdapterBase
uses gw.api.util.JurisdictionMappingUtil

@Export
class INDCPXLineExclExclusionAdapter extends ExclusionAdapterBase {
  var _owner: entity.INDCPXLineExcl

  construct(owner: entity.INDCPXLineExcl) {
    super(owner)
    _owner = owner
  }

  override property get CoverageState(): Jurisdiction {
    return _owner.INDCPXLine.BaseState
  }

  override property get PolicyLine(): PolicyLine {
    return _owner.INDCPXLine
  }

  override property get OwningCoverable(): Coverable {
    return _owner.INDCPXLine
  }

  override function addToExclusionArray( p0: Exclusion ): void {
    _owner.INDCPXLine.addToCPXLineExclusions( p0 as INDCPXLineExcl )
  }

  override function removeFromParent(): void {
    _owner.INDCPXLine.removeFromCPXLineExclusions( _owner )
  }

}