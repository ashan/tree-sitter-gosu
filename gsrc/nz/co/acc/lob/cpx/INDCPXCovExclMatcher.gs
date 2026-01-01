package nz.co.acc.lob.cpx
uses gw.lob.common.AbstractExclusionMatcher
uses gw.entity.ILinkPropertyInfo

class INDCPXCovExclMatcher extends AbstractExclusionMatcher<INDCPXCovExcl> {
  construct(owner: entity.INDCPXCovExcl) {
    super(owner)
  }

  override property get Parent(): ILinkPropertyInfo {
    return INDCPXCovExcl.Type.TypeInfo.getProperty("INDCPXCov") as ILinkPropertyInfo
  }

}