package nz.co.acc.lob.aep
uses gw.api.domain.RateFactorAdapter

@Export
class AEPLineRateFactorAdapter implements RateFactorAdapter {
  var _owner: AEPLineRF_ACC

  construct(rateFactor: AEPLineRF_ACC) {
    _owner = rateFactor
  }

  override property get Modifier(): Modifier {
    return _owner.AEPLineModifier
  }
}