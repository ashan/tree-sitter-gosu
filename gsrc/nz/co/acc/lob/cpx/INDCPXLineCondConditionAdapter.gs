package nz.co.acc.lob.cpx
uses gw.coverage.ConditionAdapterBase
uses gw.api.util.JurisdictionMappingUtil

@Export
class INDCPXLineCondConditionAdapter extends ConditionAdapterBase {
  var _owner: entity.INDCPXLineCond

  construct(owner: entity.INDCPXLineCond) {
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

  override function addToConditionArray( p0: PolicyCondition ): void {
    _owner.INDCPXLine.addToCPXLineConditions( p0 as INDCPXLineCond )
  }

  override function removeFromParent(): void {
    _owner.INDCPXLine.removeFromCPXLineConditions( _owner )
  }

}