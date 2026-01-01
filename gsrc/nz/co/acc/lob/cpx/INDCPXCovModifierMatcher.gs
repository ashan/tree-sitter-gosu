package nz.co.acc.lob.cpx
uses gw.lob.common.AbstractModifierMatcher
uses java.lang.Iterable
uses gw.entity.ILinkPropertyInfo

@Export
class INDCPXCovModifierMatcher extends AbstractModifierMatcher<INDCPXCovMod> {
  construct(owner : INDCPXCovMod) {
    super(owner)
  }

  override property get ParentColumns() : Iterable<ILinkPropertyInfo> {
    return {INDCPXCovMod.Type.TypeInfo.getProperty("INDCPXCov") as ILinkPropertyInfo}
  }
}