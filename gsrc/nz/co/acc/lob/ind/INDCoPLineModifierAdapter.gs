package nz.co.acc.lob.ind
uses gw.api.domain.ModifierAdapter

@Export
class INDCoPLineModifierAdapter implements ModifierAdapter {
  var _owner: entity.INDCoPLineMod

  construct(owner: entity.INDCoPLineMod) {
    _owner = owner
  }

  override property get OwningModifiable(): Modifiable {
    return _owner.INDCoPLine
  }

  override property get RateFactors(): RateFactor[] {
    return _owner.INDCoPLineRateFactors
  }

  override function addToRateFactors(p0: RateFactor) {
    _owner.addToINDCoPLineRateFactors(p0 as INDCoPLineRF)
  }

  override function createRawRateFactor(): RateFactor {
    return new INDCoPLineRF(_owner.Branch)
  }

  override function removeFromRateFactors(p0: RateFactor) {
    _owner.removeFromINDCoPLineRateFactors(p0 as INDCoPLineRF)
  }
}