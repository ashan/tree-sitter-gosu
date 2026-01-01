package nz.co.acc.lob.shc
uses gw.lob.common.AbstractModifierMatcher
uses java.lang.Iterable
uses gw.entity.ILinkPropertyInfo

@Export
class CWPSLineModifierMatcher extends AbstractModifierMatcher<CWPSLineMod> {
  construct(owner : CWPSLineMod) {
    super(owner)
  }

  override property get ParentColumns() : Iterable<ILinkPropertyInfo> {
    return {CWPSLineMod.Type.TypeInfo.getProperty("CWPSLine") as ILinkPropertyInfo}
  }
}