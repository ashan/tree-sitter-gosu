package nz.co.acc.lob.ind
uses gw.lob.common.AbstractConditionMatcher
uses gw.entity.ILinkPropertyInfo

class INDCoPLineCondMatcher extends AbstractConditionMatcher<INDCoPLineCond> {
  construct(owner: entity.INDCoPLineCond) {
    super(owner)
  }

  override property get Parent(): ILinkPropertyInfo {
    return INDCoPLineCond.Type.TypeInfo.getProperty("INDCoPLine") as ILinkPropertyInfo
  }

}
