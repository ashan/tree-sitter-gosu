package nz.co.acc.lob.cpx
uses gw.api.domain.ModifierAdapter

@Export
class INDCPXCovModifierAdapter implements ModifierAdapter {
  var _owner: entity.INDCPXCovMod

  construct(owner: entity.INDCPXCovMod) {
    _owner = owner
  }

  override property get OwningModifiable(): Modifiable {
    return _owner.INDCPXCov
  }

  override property get RateFactors(): RateFactor[] {
    return _owner.INDCPXCovRateFactors
  }

  override function addToRateFactors(p0: RateFactor) {
    _owner.addToINDCPXCovRateFactors(p0 as INDCPXCovRF)
  }

  override function createRawRateFactor(): RateFactor {
    return new INDCPXCovRF(_owner.Branch)
  }

  override function removeFromRateFactors(p0: RateFactor) {
    _owner.removeFromINDCPXCovRateFactors(p0 as INDCPXCovRF)
  }
}