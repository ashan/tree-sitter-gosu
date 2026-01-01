package nz.co.acc.lob.cpx
uses gw.api.domain.RateFactorAdapter

@Export
class INDCPXCovRateFactorAdapter implements RateFactorAdapter {
  var _owner: INDCPXCovRF

  construct(rateFactor: INDCPXCovRF) {
    _owner = rateFactor
  }

  override property get Modifier(): Modifier {
    return _owner.INDCPXCovModifier
  }
}