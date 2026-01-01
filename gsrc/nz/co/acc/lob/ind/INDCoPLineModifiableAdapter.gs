package nz.co.acc.lob.ind
uses gw.api.domain.ModifiableAdapter
uses java.util.Date
uses gw.api.util.JurisdictionMappingUtil

@Export
class INDCoPLineModifiableAdapter implements ModifiableAdapter {
  var _owner: entity.INDCoPLine

  construct(owner: entity.INDCoPLine) {
    _owner = owner
  }

  override property get AllModifiers(): Modifier[] {
    return _owner.INDLineModifiers
  }

  override property get PolicyLine(): PolicyLine {
    return _owner
  }

  override property get PolicyPeriod(): PolicyPeriod {
    return _owner.Branch
  }

  override property get State(): Jurisdiction {
    return _owner.BaseState
  }

  override function addToModifiers(p0: Modifier) {
    _owner.addToINDLineModifiers(p0 as INDCoPLineMod)
  }

  override function removeFromModifiers(p0: Modifier) {
    _owner.removeFromINDLineModifiers(p0 as INDCoPLineMod)
  }

  override function createRawModifier(): Modifier {
    return new INDCoPLineMod(_owner.Branch)
  }

  override function postUpdateModifiers() {
  }

  override property get ReferenceDateInternal(): Date {
    return _owner.ReferenceDateInternal
  }

  override property set ReferenceDateInternal(date: Date) {
    _owner.ReferenceDateInternal = date
  }
}