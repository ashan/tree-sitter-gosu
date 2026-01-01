package nz.co.acc.lob.aep
uses gw.lob.common.AbstractRateFactorMatcher
uses java.lang.Iterable
uses gw.entity.ILinkPropertyInfo

@Export
class AEPLineRateFactorMatcher extends AbstractRateFactorMatcher<AEPLineRF_ACC> {

  construct(owner: entity.AEPLineRF_ACC) {
    super(owner)
  }

  override property get ParentColumns(): Iterable<ILinkPropertyInfo> {
    return {AEPLineRF_ACC.Type.TypeInfo.getProperty("AEPLineModifier") as ILinkPropertyInfo};
  }

}