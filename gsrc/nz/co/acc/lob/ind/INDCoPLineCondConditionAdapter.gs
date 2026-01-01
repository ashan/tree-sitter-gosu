package nz.co.acc.lob.ind
uses gw.coverage.ConditionAdapterBase
uses gw.api.util.JurisdictionMappingUtil

@Export
class INDCoPLineCondConditionAdapter extends ConditionAdapterBase {
  var _owner: entity.INDCoPLineCond

  construct(owner: entity.INDCoPLineCond) {
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

  override function addToConditionArray( p0: PolicyCondition ): void {
    _owner.INDCoPLine.addToINDLineConditions( p0 as INDCoPLineCond )
  }

  override function removeFromParent(): void {
    _owner.INDCoPLine.removeFromINDLineConditions( _owner )
  }

}