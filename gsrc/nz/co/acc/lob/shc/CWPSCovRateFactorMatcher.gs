package nz.co.acc.lob.shc
uses gw.lob.common.AbstractRateFactorMatcher
uses java.lang.Iterable
uses gw.entity.ILinkPropertyInfo

@Export
class CWPSCovRateFactorMatcher extends AbstractRateFactorMatcher<CWPSCovRF> {

  construct(owner: entity.CWPSCovRF) {
    super(owner)
  }

  override property get ParentColumns(): Iterable<ILinkPropertyInfo> {
    return {CWPSCovRF.Type.TypeInfo.getProperty("CWPSCovModifier") as ILinkPropertyInfo};
  }

}