package nz.co.acc.lob.cpx
uses gw.api.domain.RateFactorAdapter

@Export
class INDCPXLineRateFactorAdapter implements RateFactorAdapter {
  var _owner: INDCPXLineRF

  construct(rateFactor: INDCPXLineRF) {
    _owner = rateFactor
  }

  override property get Modifier(): Modifier {
    return _owner.INDCPXLineModifier
  }
}