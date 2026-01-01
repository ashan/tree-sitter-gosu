package nz.co.acc.lob.ind
uses gw.coverage.AbstractCoverageMatcher
uses gw.entity.ILinkPropertyInfo

class INDCoPCovCovMatcher extends AbstractCoverageMatcher<INDCoPCovCov> {
  construct(owner: entity.INDCoPCovCov) {
    super(owner)
  }

  override property get CoverableColumns(): List<ILinkPropertyInfo> {
    return {INDCoPCovCov.Type.TypeInfo.getProperty("INDCoPCov") as ILinkPropertyInfo}
  }

}