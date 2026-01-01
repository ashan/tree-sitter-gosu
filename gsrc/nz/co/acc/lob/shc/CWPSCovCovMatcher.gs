package nz.co.acc.lob.shc
uses gw.coverage.AbstractCoverageMatcher
uses gw.entity.ILinkPropertyInfo

class CWPSCovCovMatcher extends AbstractCoverageMatcher<CWPSCovCov> {
  construct(owner: entity.CWPSCovCov) {
    super(owner)
  }

  override property get CoverableColumns(): List<ILinkPropertyInfo> {
    return {CWPSCovCov.Type.TypeInfo.getProperty("CWPSCov") as ILinkPropertyInfo}
  }

}