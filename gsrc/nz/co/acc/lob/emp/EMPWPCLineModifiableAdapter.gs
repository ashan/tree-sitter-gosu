package nz.co.acc.lob.emp
uses gw.api.domain.ModifiableAdapter
uses java.util.Date
uses gw.api.util.JurisdictionMappingUtil

@Export
class EMPWPCLineModifiableAdapter implements ModifiableAdapter {
  var _owner: entity.EMPWPCLine

  construct(owner: entity.EMPWPCLine) {
    _owner = owner
  }

  override property get AllModifiers(): Modifier[] {
    return _owner.EMPLineModifiers
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
    _owner.addToEMPLineModifiers(p0 as EMPWPCLineMod)
  }

  override function removeFromModifiers(p0: Modifier) {
    _owner.removeFromEMPLineModifiers(p0 as EMPWPCLineMod)
  }

  override function createRawModifier(): Modifier {
    return new EMPWPCLineMod(_owner.Branch)
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