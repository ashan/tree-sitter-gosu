<% uses gw.acc.npg.model.Coverable %>
<%@ params(coverable:Coverable) %>
package ${coverable.LOBPackageName}
uses gw.coverage.AbstractCoverageMatcher
uses gw.entity.ILinkPropertyInfo

class ${coverable.Coverage.CoverageMatcherImplName} extends AbstractCoverageMatcher<${coverable.Coverage.EntityName}> {
  construct(owner: entity.${coverable.Coverage.EntityName}) {
    super(owner)
  }

  override property get CoverableColumns(): List<ILinkPropertyInfo> {
    return {${coverable.Coverage.EntityName}.Type.TypeInfo.getProperty("${coverable.Coverage.FkFieldToCoverable.Name}") as ILinkPropertyInfo}
  }

}