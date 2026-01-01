package nz.co.acc.lob.emp
uses gw.lob.common.AbstractModifierMatcher
uses java.lang.Iterable
uses gw.entity.ILinkPropertyInfo

@Export
class EMPWPCCovModifierMatcher extends AbstractModifierMatcher<EMPWPCCovMod> {
  construct(owner : EMPWPCCovMod) {
    super(owner)
  }

  override property get ParentColumns() : Iterable<ILinkPropertyInfo> {
    return {EMPWPCCovMod.Type.TypeInfo.getProperty("EMPWPCCov") as ILinkPropertyInfo}
  }
}