package nz.co.acc.lob.cpx
uses gw.api.domain.ModifiableAdapter
uses java.util.Date
uses gw.api.util.JurisdictionMappingUtil

@Export
class INDCPXLineModifiableAdapter implements ModifiableAdapter {
  var _owner: entity.INDCPXLine

  construct(owner: entity.INDCPXLine) {
    _owner = owner
  }

  override property get AllModifiers(): Modifier[] {
    return _owner.CPXLineModifiers
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
    _owner.addToCPXLineModifiers(p0 as INDCPXLineMod)
  }

  override function removeFromModifiers(p0: Modifier) {
    _owner.removeFromCPXLineModifiers(p0 as INDCPXLineMod)
  }

  override function createRawModifier(): Modifier {
    return new INDCPXLineMod(_owner.Branch)
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