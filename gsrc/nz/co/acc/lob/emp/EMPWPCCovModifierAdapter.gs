package nz.co.acc.lob.emp
uses gw.api.domain.ModifierAdapter

@Export
class EMPWPCCovModifierAdapter implements ModifierAdapter {
  var _owner: entity.EMPWPCCovMod

  construct(owner: entity.EMPWPCCovMod) {
    _owner = owner
  }

  override property get OwningModifiable(): Modifiable {
    return _owner.EMPWPCCov
  }

  override property get RateFactors(): RateFactor[] {
    return _owner.EMPWPCCovRateFactors
  }

  override function addToRateFactors(p0: RateFactor) {
    _owner.addToEMPWPCCovRateFactors(p0 as EMPWPCCovRF)
  }

  override function createRawRateFactor(): RateFactor {
    return new EMPWPCCovRF(_owner.Branch)
  }

  override function removeFromRateFactors(p0: RateFactor) {
    _owner.removeFromEMPWPCCovRateFactors(p0 as EMPWPCCovRF)
  }
}