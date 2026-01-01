package nz.co.acc.lob.ind
uses gw.api.domain.RateFactorAdapter

@Export
class INDCoPLineRateFactorAdapter implements RateFactorAdapter {
  var _owner: INDCoPLineRF

  construct(rateFactor: INDCoPLineRF) {
    _owner = rateFactor
  }

  override property get Modifier(): Modifier {
    return _owner.INDCoPLineModifier
  }
}