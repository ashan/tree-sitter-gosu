package nz.co.acc.lob.ind
uses gw.lob.common.AbstractExclusionMatcher
uses gw.entity.ILinkPropertyInfo

class INDCoPLineExclMatcher extends AbstractExclusionMatcher<INDCoPLineExcl> {
  construct(owner: entity.INDCoPLineExcl) {
    super(owner)
  }

  override property get Parent(): ILinkPropertyInfo {
    return INDCoPLineExcl.Type.TypeInfo.getProperty("INDCoPLine") as ILinkPropertyInfo
  }

}