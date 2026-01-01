package nz.co.acc.lob.ind
uses gw.lob.common.AbstractExclusionMatcher
uses gw.entity.ILinkPropertyInfo

class INDCoPCovExclMatcher extends AbstractExclusionMatcher<INDCoPCovExcl> {
  construct(owner: entity.INDCoPCovExcl) {
    super(owner)
  }

  override property get Parent(): ILinkPropertyInfo {
    return INDCoPCovExcl.Type.TypeInfo.getProperty("INDCoPCov") as ILinkPropertyInfo
  }

}