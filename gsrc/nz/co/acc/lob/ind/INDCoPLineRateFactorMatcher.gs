package nz.co.acc.lob.ind
uses gw.lob.common.AbstractRateFactorMatcher
uses java.lang.Iterable
uses gw.entity.ILinkPropertyInfo

@Export
class INDCoPLineRateFactorMatcher extends AbstractRateFactorMatcher<INDCoPLineRF> {

  construct(owner: entity.INDCoPLineRF) {
    super(owner)
  }

  override property get ParentColumns(): Iterable<ILinkPropertyInfo> {
    return {INDCoPLineRF.Type.TypeInfo.getProperty("INDCoPLineModifier") as ILinkPropertyInfo};
  }

}