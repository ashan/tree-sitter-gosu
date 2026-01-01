package nz.co.acc.lob.ind
uses gw.coverage.ConditionAdapterBase
uses gw.api.util.JurisdictionMappingUtil

@Export
class INDCoPCovCondConditionAdapter extends ConditionAdapterBase {
  var _owner: entity.INDCoPCovCond

  construct(owner: entity.INDCoPCovCond) {
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

  override function addToConditionArray( p0: PolicyCondition ): void {
    _owner.INDCoPCov.addToConditions( p0 as INDCoPCovCond )
  }

  override function removeFromParent(): void {
    _owner.INDCoPCov.removeFromConditions( _owner )
  }

}