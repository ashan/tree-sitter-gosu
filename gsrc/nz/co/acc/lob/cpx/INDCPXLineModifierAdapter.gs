package nz.co.acc.lob.cpx
uses gw.api.domain.ModifierAdapter

@Export
class INDCPXLineModifierAdapter implements ModifierAdapter {
  var _owner: entity.INDCPXLineMod

  construct(owner: entity.INDCPXLineMod) {
    _owner = owner
  }

  override property get OwningModifiable(): Modifiable {
    return _owner.INDCPXLine
  }

  override property get RateFactors(): RateFactor[] {
    return _owner.INDCPXLineRateFactors
  }

  override function addToRateFactors(p0: RateFactor) {
    _owner.addToINDCPXLineRateFactors(p0 as INDCPXLineRF)
  }

  override function createRawRateFactor(): RateFactor {
    return new INDCPXLineRF(_owner.Branch)
  }

  override function removeFromRateFactors(p0: RateFactor) {
    _owner.removeFromINDCPXLineRateFactors(p0 as INDCPXLineRF)
  }
}