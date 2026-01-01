package nz.co.acc.lob.ind
uses gw.coverage.AbstractCoverageMatcher
uses gw.entity.ILinkPropertyInfo

class INDCoPLineCovMatcher extends AbstractCoverageMatcher<INDCoPLineCov> {
  construct(owner: entity.INDCoPLineCov) {
    super(owner)
  }

  override property get CoverableColumns(): List<ILinkPropertyInfo> {
    return {INDCoPLineCov.Type.TypeInfo.getProperty("INDCoPLine") as ILinkPropertyInfo}
  }

}