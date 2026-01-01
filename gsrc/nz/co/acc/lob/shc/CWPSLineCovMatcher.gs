package nz.co.acc.lob.shc
uses gw.coverage.AbstractCoverageMatcher
uses gw.entity.ILinkPropertyInfo

class CWPSLineCovMatcher extends AbstractCoverageMatcher<CWPSLineCov> {
  construct(owner: entity.CWPSLineCov) {
    super(owner)
  }

  override property get CoverableColumns(): List<ILinkPropertyInfo> {
    return {CWPSLineCov.Type.TypeInfo.getProperty("CWPSLine") as ILinkPropertyInfo}
  }

}