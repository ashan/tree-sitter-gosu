package nz.co.acc.lob.shc
uses gw.lob.common.AbstractRateFactorMatcher
uses java.lang.Iterable
uses gw.entity.ILinkPropertyInfo

@Export
class CWPSLineRateFactorMatcher extends AbstractRateFactorMatcher<CWPSLineRF> {

  construct(owner: entity.CWPSLineRF) {
    super(owner)
  }

  override property get ParentColumns(): Iterable<ILinkPropertyInfo> {
    return {CWPSLineRF.Type.TypeInfo.getProperty("CWPSLineModifier") as ILinkPropertyInfo};
  }

}