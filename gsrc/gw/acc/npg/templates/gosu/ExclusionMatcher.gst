<% uses gw.acc.npg.model.Coverable %>
<%@ params(coverable:Coverable) %>
package ${coverable.LOBPackageName}
uses gw.lob.common.AbstractExclusionMatcher
uses gw.entity.ILinkPropertyInfo

class ${coverable.Exclusion.ExclusionMatcherImplName} extends AbstractExclusionMatcher<${coverable.Exclusion.EntityName}> {
  construct(owner: entity.${coverable.Exclusion.EntityName}) {
    super(owner)
  }

  override property get Parent(): ILinkPropertyInfo {
    return ${coverable.Exclusion.EntityName}.Type.TypeInfo.getProperty("${coverable.Exclusion.FkFieldToCoverable.Name}") as ILinkPropertyInfo
  }

}