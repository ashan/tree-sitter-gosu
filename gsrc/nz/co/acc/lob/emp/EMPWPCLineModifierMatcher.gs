package nz.co.acc.lob.emp
uses gw.lob.common.AbstractModifierMatcher
uses java.lang.Iterable
uses gw.entity.ILinkPropertyInfo

@Export
class EMPWPCLineModifierMatcher extends AbstractModifierMatcher<EMPWPCLineMod> {
  construct(owner : EMPWPCLineMod) {
    super(owner)
  }

  override property get ParentColumns() : Iterable<ILinkPropertyInfo> {
    return {EMPWPCLineMod.Type.TypeInfo.getProperty("EMPWPCLine") as ILinkPropertyInfo}
  }
}