package nz.co.acc.lob.ind
uses gw.lob.common.AbstractRateFactorMatcher
uses java.lang.Iterable
uses gw.entity.ILinkPropertyInfo

@Export
class INDCoPCovRateFactorMatcher extends AbstractRateFactorMatcher<INDCoPCovRF> {

  construct(owner: entity.INDCoPCovRF) {
    super(owner)
  }

  override property get ParentColumns(): Iterable<ILinkPropertyInfo> {
    return {INDCoPCovRF.Type.TypeInfo.getProperty("INDCoPCovModifier") as ILinkPropertyInfo};
  }

}