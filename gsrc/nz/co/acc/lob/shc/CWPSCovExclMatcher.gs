package nz.co.acc.lob.shc
uses gw.lob.common.AbstractExclusionMatcher
uses gw.entity.ILinkPropertyInfo

class CWPSCovExclMatcher extends AbstractExclusionMatcher<CWPSCovExcl> {
  construct(owner: entity.CWPSCovExcl) {
    super(owner)
  }

  override property get Parent(): ILinkPropertyInfo {
    return CWPSCovExcl.Type.TypeInfo.getProperty("CWPSCov") as ILinkPropertyInfo
  }

}