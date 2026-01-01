package nz.co.acc.lob.shc
uses gw.api.domain.RateFactorAdapter

@Export
class CWPSCovRateFactorAdapter implements RateFactorAdapter {
  var _owner: CWPSCovRF

  construct(rateFactor: CWPSCovRF) {
    _owner = rateFactor
  }

  override property get Modifier(): Modifier {
    return _owner.CWPSCovModifier
  }
}