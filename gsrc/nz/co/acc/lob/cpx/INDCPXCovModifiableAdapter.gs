package nz.co.acc.lob.cpx
uses gw.api.domain.ModifiableAdapter
uses java.util.Date
uses gw.api.util.JurisdictionMappingUtil

@Export
class INDCPXCovModifiableAdapter implements ModifiableAdapter {
  var _owner: entity.INDCPXCov

  construct(owner: entity.INDCPXCov) {
    _owner = owner
  }

  override property get AllModifiers(): Modifier[] {
    return _owner.Modifiers
  }

  override property get PolicyLine(): PolicyLine {
    return _owner.INDCPXLine
  }

  override property get PolicyPeriod(): PolicyPeriod {
    return _owner.Branch
  }

  override property get State(): Jurisdiction {
    return _owner.INDCPXLine.BaseState
  }

  override function addToModifiers(p0: Modifier) {
    _owner.addToModifiers(p0 as INDCPXCovMod)
  }

  override function removeFromModifiers(p0: Modifier) {
    _owner.removeFromModifiers(p0 as INDCPXCovMod)
  }

  override function createRawModifier(): Modifier {
    return new INDCPXCovMod(_owner.Branch)
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