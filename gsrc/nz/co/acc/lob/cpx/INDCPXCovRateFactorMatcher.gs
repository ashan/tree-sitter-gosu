package nz.co.acc.lob.cpx
uses gw.lob.common.AbstractRateFactorMatcher
uses java.lang.Iterable
uses gw.entity.ILinkPropertyInfo

@Export
class INDCPXCovRateFactorMatcher extends AbstractRateFactorMatcher<INDCPXCovRF> {

  construct(owner: entity.INDCPXCovRF) {
    super(owner)
  }

  override property get ParentColumns(): Iterable<ILinkPropertyInfo> {
    return {INDCPXCovRF.Type.TypeInfo.getProperty("INDCPXCovModifier") as ILinkPropertyInfo};
  }

}