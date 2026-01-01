package nz.co.acc.lob.shc
uses gw.lob.common.AbstractModifierMatcher
uses java.lang.Iterable
uses gw.entity.ILinkPropertyInfo

@Export
class CWPSCovModifierMatcher extends AbstractModifierMatcher<CWPSCovMod> {
  construct(owner : CWPSCovMod) {
    super(owner)
  }

  override property get ParentColumns() : Iterable<ILinkPropertyInfo> {
    return {CWPSCovMod.Type.TypeInfo.getProperty("CWPSCov") as ILinkPropertyInfo}
  }
}