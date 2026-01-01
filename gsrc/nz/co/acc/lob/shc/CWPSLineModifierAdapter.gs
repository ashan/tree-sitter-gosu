package nz.co.acc.lob.shc
uses gw.api.domain.ModifierAdapter

@Export
class CWPSLineModifierAdapter implements ModifierAdapter {
  var _owner: entity.CWPSLineMod

  construct(owner: entity.CWPSLineMod) {
    _owner = owner
  }

  override property get OwningModifiable(): Modifiable {
    return _owner.CWPSLine
  }

  override property get RateFactors(): RateFactor[] {
    return _owner.CWPSLineRateFactors
  }

  override function addToRateFactors(p0: RateFactor) {
    _owner.addToCWPSLineRateFactors(p0 as CWPSLineRF)
  }

  override function createRawRateFactor(): RateFactor {
    return new CWPSLineRF(_owner.Branch)
  }

  override function removeFromRateFactors(p0: RateFactor) {
    _owner.removeFromCWPSLineRateFactors(p0 as CWPSLineRF)
  }
}