package nz.co.acc.lob.cpx
uses gw.coverage.AbstractCoverageMatcher
uses gw.entity.ILinkPropertyInfo

class INDCPXCovCovMatcher extends AbstractCoverageMatcher<INDCPXCovCov> {
  construct(owner: entity.INDCPXCovCov) {
    super(owner)
  }

  override property get CoverableColumns(): List<ILinkPropertyInfo> {
    return {INDCPXCovCov.Type.TypeInfo.getProperty("INDCPXCov") as ILinkPropertyInfo}
  }

}