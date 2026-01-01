package nz.co.acc.lob.emp
uses gw.coverage.AbstractCoverageMatcher
uses gw.entity.ILinkPropertyInfo

class EMPWPCLineCovMatcher extends AbstractCoverageMatcher<EMPWPCLineCov> {
  construct(owner: entity.EMPWPCLineCov) {
    super(owner)
  }

  override property get CoverableColumns(): List<ILinkPropertyInfo> {
    return {EMPWPCLineCov.Type.TypeInfo.getProperty("EMPWPCLine") as ILinkPropertyInfo}
  }

}