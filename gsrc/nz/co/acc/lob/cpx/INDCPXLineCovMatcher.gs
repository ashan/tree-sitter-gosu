package nz.co.acc.lob.cpx
uses gw.coverage.AbstractCoverageMatcher
uses gw.entity.ILinkPropertyInfo

class INDCPXLineCovMatcher extends AbstractCoverageMatcher<INDCPXLineCov> {
  construct(owner: entity.INDCPXLineCov) {
    super(owner)
  }

  override property get CoverableColumns(): List<ILinkPropertyInfo> {
    return {INDCPXLineCov.Type.TypeInfo.getProperty("INDCPXLine") as ILinkPropertyInfo}
  }

}