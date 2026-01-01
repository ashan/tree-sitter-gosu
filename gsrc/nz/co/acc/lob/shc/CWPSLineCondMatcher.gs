package nz.co.acc.lob.shc
uses gw.lob.common.AbstractConditionMatcher
uses gw.entity.ILinkPropertyInfo

class CWPSLineCondMatcher extends AbstractConditionMatcher<CWPSLineCond> {
  construct(owner: entity.CWPSLineCond) {
    super(owner)
  }

  override property get Parent(): ILinkPropertyInfo {
    return CWPSLineCond.Type.TypeInfo.getProperty("CWPSLine") as ILinkPropertyInfo
  }

}
