package nz.co.acc.lob.emp
uses gw.coverage.AbstractCoverageMatcher
uses gw.entity.ILinkPropertyInfo

class EMPWPCCovCovMatcher extends AbstractCoverageMatcher<EMPWPCCovCov> {
  construct(owner: entity.EMPWPCCovCov) {
    super(owner)
  }

  override property get CoverableColumns(): List<ILinkPropertyInfo> {
    return {EMPWPCCovCov.Type.TypeInfo.getProperty("EMPWPCCov") as ILinkPropertyInfo}
  }

}