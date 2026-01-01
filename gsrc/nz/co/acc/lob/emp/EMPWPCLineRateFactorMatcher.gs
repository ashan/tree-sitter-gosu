package nz.co.acc.lob.emp
uses gw.lob.common.AbstractRateFactorMatcher
uses java.lang.Iterable
uses gw.entity.ILinkPropertyInfo

@Export
class EMPWPCLineRateFactorMatcher extends AbstractRateFactorMatcher<EMPWPCLineRF> {

  construct(owner: entity.EMPWPCLineRF) {
    super(owner)
  }

  override property get ParentColumns(): Iterable<ILinkPropertyInfo> {
    return {EMPWPCLineRF.Type.TypeInfo.getProperty("EMPWPCLineModifier") as ILinkPropertyInfo};
  }

}