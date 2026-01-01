package nz.co.acc.lob.shc
uses gw.api.domain.ModifierAdapter

@Export
class CWPSCovModifierAdapter implements ModifierAdapter {
  var _owner: entity.CWPSCovMod

  construct(owner: entity.CWPSCovMod) {
    _owner = owner
  }

  override property get OwningModifiable(): Modifiable {
    return _owner.CWPSCov
  }

  override property get RateFactors(): RateFactor[] {
    return _owner.CWPSCovRateFactors
  }

  override function addToRateFactors(p0: RateFactor) {
    _owner.addToCWPSCovRateFactors(p0 as CWPSCovRF)
  }

  override function createRawRateFactor(): RateFactor {
    return new CWPSCovRF(_owner.Branch)
  }

  override function removeFromRateFactors(p0: RateFactor) {
    _owner.removeFromCWPSCovRateFactors(p0 as CWPSCovRF)
  }
}