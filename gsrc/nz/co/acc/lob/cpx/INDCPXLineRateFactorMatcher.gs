package nz.co.acc.lob.cpx
uses gw.lob.common.AbstractRateFactorMatcher
uses java.lang.Iterable
uses gw.entity.ILinkPropertyInfo

@Export
class INDCPXLineRateFactorMatcher extends AbstractRateFactorMatcher<INDCPXLineRF> {

  construct(owner: entity.INDCPXLineRF) {
    super(owner)
  }

  override property get ParentColumns(): Iterable<ILinkPropertyInfo> {
    return {INDCPXLineRF.Type.TypeInfo.getProperty("INDCPXLineModifier") as ILinkPropertyInfo};
  }

}