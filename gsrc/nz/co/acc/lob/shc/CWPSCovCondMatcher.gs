package nz.co.acc.lob.shc
uses gw.lob.common.AbstractConditionMatcher
uses gw.entity.ILinkPropertyInfo

class CWPSCovCondMatcher extends AbstractConditionMatcher<CWPSCovCond> {
  construct(owner: entity.CWPSCovCond) {
    super(owner)
  }

  override property get Parent(): ILinkPropertyInfo {
    return CWPSCovCond.Type.TypeInfo.getProperty("CWPSCov") as ILinkPropertyInfo
  }

}
