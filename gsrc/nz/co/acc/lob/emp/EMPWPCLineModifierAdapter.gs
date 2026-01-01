package nz.co.acc.lob.emp
uses gw.api.domain.ModifierAdapter

@Export
class EMPWPCLineModifierAdapter implements ModifierAdapter {
  var _owner: entity.EMPWPCLineMod

  construct(owner: entity.EMPWPCLineMod) {
    _owner = owner
  }

  override property get OwningModifiable(): Modifiable {
    return _owner.EMPWPCLine
  }

  override property get RateFactors(): RateFactor[] {
    return _owner.EMPWPCLineRateFactors
  }

  override function addToRateFactors(p0: RateFactor) {
    _owner.addToEMPWPCLineRateFactors(p0 as EMPWPCLineRF)
  }

  override function createRawRateFactor(): RateFactor {
    return new EMPWPCLineRF(_owner.Branch)
  }

  override function removeFromRateFactors(p0: RateFactor) {
    _owner.removeFromEMPWPCLineRateFactors(p0 as EMPWPCLineRF)
  }
}