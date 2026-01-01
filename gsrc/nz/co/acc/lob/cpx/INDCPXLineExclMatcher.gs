package nz.co.acc.lob.cpx
uses gw.lob.common.AbstractExclusionMatcher
uses gw.entity.ILinkPropertyInfo

class INDCPXLineExclMatcher extends AbstractExclusionMatcher<INDCPXLineExcl> {
  construct(owner: entity.INDCPXLineExcl) {
    super(owner)
  }

  override property get Parent(): ILinkPropertyInfo {
    return INDCPXLineExcl.Type.TypeInfo.getProperty("INDCPXLine") as ILinkPropertyInfo
  }

}