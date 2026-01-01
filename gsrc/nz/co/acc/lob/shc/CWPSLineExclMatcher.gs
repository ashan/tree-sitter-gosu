package nz.co.acc.lob.shc
uses gw.lob.common.AbstractExclusionMatcher
uses gw.entity.ILinkPropertyInfo

class CWPSLineExclMatcher extends AbstractExclusionMatcher<CWPSLineExcl> {
  construct(owner: entity.CWPSLineExcl) {
    super(owner)
  }

  override property get Parent(): ILinkPropertyInfo {
    return CWPSLineExcl.Type.TypeInfo.getProperty("CWPSLine") as ILinkPropertyInfo
  }

}