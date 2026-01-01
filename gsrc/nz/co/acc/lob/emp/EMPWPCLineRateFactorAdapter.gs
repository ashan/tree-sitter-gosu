package nz.co.acc.lob.emp
uses gw.api.domain.RateFactorAdapter

@Export
class EMPWPCLineRateFactorAdapter implements RateFactorAdapter {
  var _owner: EMPWPCLineRF

  construct(rateFactor: EMPWPCLineRF) {
    _owner = rateFactor
  }

  override property get Modifier(): Modifier {
    return _owner.EMPWPCLineModifier
  }
}