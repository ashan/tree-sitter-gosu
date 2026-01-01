package nz.co.acc.lob.ind
uses gw.api.domain.ModifierAdapter

@Export
class INDCoPCovModifierAdapter implements ModifierAdapter {
  var _owner: entity.INDCoPCovMod

  construct(owner: entity.INDCoPCovMod) {
    _owner = owner
  }

  override property get OwningModifiable(): Modifiable {
    return _owner.INDCoPCov
  }

  override property get RateFactors(): RateFactor[] {
    return _owner.INDCoPCovRateFactors
  }

  override function addToRateFactors(p0: RateFactor) {
    _owner.addToINDCoPCovRateFactors(p0 as INDCoPCovRF)
  }

  override function createRawRateFactor(): RateFactor {
    return new INDCoPCovRF(_owner.Branch)
  }

  override function removeFromRateFactors(p0: RateFactor) {
    _owner.removeFromINDCoPCovRateFactors(p0 as INDCoPCovRF)
  }
}