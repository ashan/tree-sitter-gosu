package nz.co.acc.lob.ind
uses gw.lob.common.AbstractModifierMatcher
uses java.lang.Iterable
uses gw.entity.ILinkPropertyInfo

@Export
class INDCoPLineModifierMatcher extends AbstractModifierMatcher<INDCoPLineMod> {
  construct(owner : INDCoPLineMod) {
    super(owner)
  }

  override property get ParentColumns() : Iterable<ILinkPropertyInfo> {
    return {INDCoPLineMod.Type.TypeInfo.getProperty("INDCoPLine") as ILinkPropertyInfo}
  }
}