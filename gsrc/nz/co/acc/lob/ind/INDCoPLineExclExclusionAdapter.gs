package nz.co.acc.lob.ind
uses gw.coverage.ExclusionAdapterBase
uses gw.api.util.JurisdictionMappingUtil

@Export
class INDCoPLineExclExclusionAdapter extends ExclusionAdapterBase {
  var _owner: entity.INDCoPLineExcl

  construct(owner: entity.INDCoPLineExcl) {
    super(owner)
    _owner = owner
  }

  override property get CoverageState(): Jurisdiction {
    return _owner.INDCoPLine.BaseState
  }

  override property get PolicyLine(): PolicyLine {
    return _owner.INDCoPLine
  }

  override property get OwningCoverable(): Coverable {
    return _owner.INDCoPLine
  }

  override function addToExclusionArray( p0: Exclusion ): void {
    _owner.INDCoPLine.addToINDLineExclusions( p0 as INDCoPLineExcl )
  }

  override function removeFromParent(): void {
    _owner.INDCoPLine.removeFromINDLineExclusions( _owner )
  }

}