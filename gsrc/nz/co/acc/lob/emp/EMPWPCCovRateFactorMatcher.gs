package nz.co.acc.lob.emp
uses gw.lob.common.AbstractRateFactorMatcher
uses java.lang.Iterable
uses gw.entity.ILinkPropertyInfo

@Export
class EMPWPCCovRateFactorMatcher extends AbstractRateFactorMatcher<EMPWPCCovRF> {

  construct(owner: entity.EMPWPCCovRF) {
    super(owner)
  }

  override property get ParentColumns(): Iterable<ILinkPropertyInfo> {
    return {EMPWPCCovRF.Type.TypeInfo.getProperty("EMPWPCCovModifier") as ILinkPropertyInfo};
  }

}