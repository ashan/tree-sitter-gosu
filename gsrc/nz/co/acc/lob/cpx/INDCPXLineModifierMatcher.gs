package nz.co.acc.lob.cpx
uses gw.lob.common.AbstractModifierMatcher
uses java.lang.Iterable
uses gw.entity.ILinkPropertyInfo

@Export
class INDCPXLineModifierMatcher extends AbstractModifierMatcher<INDCPXLineMod> {
  construct(owner : INDCPXLineMod) {
    super(owner)
  }

  override property get ParentColumns() : Iterable<ILinkPropertyInfo> {
    return {INDCPXLineMod.Type.TypeInfo.getProperty("INDCPXLine") as ILinkPropertyInfo}
  }
}