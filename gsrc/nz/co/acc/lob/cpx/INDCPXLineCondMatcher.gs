package nz.co.acc.lob.cpx
uses gw.lob.common.AbstractConditionMatcher
uses gw.entity.ILinkPropertyInfo

class INDCPXLineCondMatcher extends AbstractConditionMatcher<INDCPXLineCond> {
  construct(owner: entity.INDCPXLineCond) {
    super(owner)
  }

  override property get Parent(): ILinkPropertyInfo {
    return INDCPXLineCond.Type.TypeInfo.getProperty("INDCPXLine") as ILinkPropertyInfo
  }

}
