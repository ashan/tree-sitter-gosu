package nz.co.acc.lob.ind
uses gw.lob.common.AbstractConditionMatcher
uses gw.entity.ILinkPropertyInfo

class INDCoPCovCondMatcher extends AbstractConditionMatcher<INDCoPCovCond> {
  construct(owner: entity.INDCoPCovCond) {
    super(owner)
  }

  override property get Parent(): ILinkPropertyInfo {
    return INDCoPCovCond.Type.TypeInfo.getProperty("INDCoPCov") as ILinkPropertyInfo
  }

}
