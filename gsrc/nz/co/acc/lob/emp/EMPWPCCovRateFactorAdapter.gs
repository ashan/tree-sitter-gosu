package nz.co.acc.lob.emp
uses gw.api.domain.RateFactorAdapter

@Export
class EMPWPCCovRateFactorAdapter implements RateFactorAdapter {
  var _owner: EMPWPCCovRF

  construct(rateFactor: EMPWPCCovRF) {
    _owner = rateFactor
  }

  override property get Modifier(): Modifier {
    return _owner.EMPWPCCovModifier
  }
}