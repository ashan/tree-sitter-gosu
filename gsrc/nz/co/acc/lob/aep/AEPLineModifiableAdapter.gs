package nz.co.acc.lob.aep
uses gw.api.domain.ModifiableAdapter
uses java.util.Date
uses gw.api.util.JurisdictionMappingUtil

@Export
class AEPLineModifiableAdapter implements ModifiableAdapter {
  var _owner: entity.AEPLine_ACC

  construct(owner: entity.AEPLine_ACC) {
    _owner = owner
  }

  override property get AllModifiers(): Modifier[] {
    return _owner.AEPLineModifiers
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
    _owner.addToAEPLineModifiers(p0 as AEPLineMod_ACC)
  }

  override function removeFromModifiers(p0: Modifier) {
    _owner.removeFromAEPLineModifiers(p0 as AEPLineMod_ACC)
  }

  override function createRawModifier(): Modifier {
    return new AEPLineMod_ACC(_owner.Branch)
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