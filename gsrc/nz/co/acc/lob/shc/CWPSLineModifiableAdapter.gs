package nz.co.acc.lob.shc
uses gw.api.domain.ModifiableAdapter
uses java.util.Date
uses gw.api.util.JurisdictionMappingUtil

@Export
class CWPSLineModifiableAdapter implements ModifiableAdapter {
  var _owner: entity.CWPSLine

  construct(owner: entity.CWPSLine) {
    _owner = owner
  }

  override property get AllModifiers(): Modifier[] {
    return _owner.SHCLineModifiers
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
    _owner.addToSHCLineModifiers(p0 as CWPSLineMod)
  }

  override function removeFromModifiers(p0: Modifier) {
    _owner.removeFromSHCLineModifiers(p0 as CWPSLineMod)
  }

  override function createRawModifier(): Modifier {
    return new CWPSLineMod(_owner.Branch)
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