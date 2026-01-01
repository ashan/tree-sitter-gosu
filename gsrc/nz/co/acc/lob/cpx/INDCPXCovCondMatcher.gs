package nz.co.acc.lob.cpx
uses gw.lob.common.AbstractConditionMatcher
uses gw.entity.ILinkPropertyInfo

class INDCPXCovCondMatcher extends AbstractConditionMatcher<INDCPXCovCond> {
  construct(owner: entity.INDCPXCovCond) {
    super(owner)
  }

  override property get Parent(): ILinkPropertyInfo {
    return INDCPXCovCond.Type.TypeInfo.getProperty("INDCPXCov") as ILinkPropertyInfo
  }

}
