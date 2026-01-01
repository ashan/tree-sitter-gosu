package nz.co.acc.lob.ind
uses gw.lob.common.AbstractModifierMatcher
uses java.lang.Iterable
uses gw.entity.ILinkPropertyInfo

@Export
class INDCoPCovModifierMatcher extends AbstractModifierMatcher<INDCoPCovMod> {
  construct(owner : INDCoPCovMod) {
    super(owner)
  }

  override property get ParentColumns() : Iterable<ILinkPropertyInfo> {
    return {INDCoPCovMod.Type.TypeInfo.getProperty("INDCoPCov") as ILinkPropertyInfo}
  }
}