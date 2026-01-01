package nz.co.acc.lob.aep
uses gw.api.domain.ModifierAdapter

@Export
class AEPLineModifierAdapter implements ModifierAdapter {
  var _owner: entity.AEPLineMod_ACC

  construct(owner: entity.AEPLineMod_ACC) {
    _owner = owner
  }

  override property get OwningModifiable(): Modifiable {
    return _owner.AEPLine
  }

  override property get RateFactors(): RateFactor[] {
    return _owner.AEPLineRateFactors
  }

  override function addToRateFactors(p0: RateFactor) {
    _owner.addToAEPLineRateFactors(p0 as AEPLineRF_ACC)
  }

  override function createRawRateFactor(): RateFactor {
    return new AEPLineRF_ACC(_owner.Branch)
  }

  override function removeFromRateFactors(p0: RateFactor) {
    _owner.removeFromAEPLineRateFactors(p0 as AEPLineRF_ACC)
  }
}