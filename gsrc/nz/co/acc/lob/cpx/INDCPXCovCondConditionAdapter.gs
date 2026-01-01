package nz.co.acc.lob.cpx
uses gw.coverage.ConditionAdapterBase
uses gw.api.util.JurisdictionMappingUtil

@Export
class INDCPXCovCondConditionAdapter extends ConditionAdapterBase {
  var _owner: entity.INDCPXCovCond

  construct(owner: entity.INDCPXCovCond) {
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

  override function addToConditionArray( p0: PolicyCondition ): void {
    _owner.INDCPXCov.addToConditions( p0 as INDCPXCovCond )
  }

  override function removeFromParent(): void {
    _owner.INDCPXCov.removeFromConditions( _owner )
  }

}