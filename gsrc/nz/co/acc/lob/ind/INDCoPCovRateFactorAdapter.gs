package nz.co.acc.lob.ind
uses gw.api.domain.RateFactorAdapter

@Export
class INDCoPCovRateFactorAdapter implements RateFactorAdapter {
  var _owner: INDCoPCovRF

  construct(rateFactor: INDCoPCovRF) {
    _owner = rateFactor
  }

  override property get Modifier(): Modifier {
    return _owner.INDCoPCovModifier
  }
}