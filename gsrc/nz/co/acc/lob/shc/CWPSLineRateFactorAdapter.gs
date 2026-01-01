package nz.co.acc.lob.shc
uses gw.api.domain.RateFactorAdapter

@Export
class CWPSLineRateFactorAdapter implements RateFactorAdapter {
  var _owner: CWPSLineRF

  construct(rateFactor: CWPSLineRF) {
    _owner = rateFactor
  }

  override property get Modifier(): Modifier {
    return _owner.CWPSLineModifier
  }
}