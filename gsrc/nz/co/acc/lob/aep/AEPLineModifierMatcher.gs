package nz.co.acc.lob.aep
uses gw.lob.common.AbstractModifierMatcher
uses java.lang.Iterable
uses gw.entity.ILinkPropertyInfo

@Export
class AEPLineModifierMatcher extends AbstractModifierMatcher<AEPLineMod_ACC> {
  construct(owner : AEPLineMod_ACC) {
    super(owner)
  }

  override property get ParentColumns() : Iterable<ILinkPropertyInfo> {
    return {AEPLineMod_ACC.Type.TypeInfo.getProperty("AEPLine") as ILinkPropertyInfo}
  }
}