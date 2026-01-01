<% uses gw.acc.npg.model.Coverable %>
<%@ params(coverable:Coverable) %>
package ${coverable.LOBPackageName}
uses gw.lob.common.AbstractConditionMatcher
uses gw.entity.ILinkPropertyInfo

class ${coverable.Condition.ConditionMatcherImplName} extends AbstractConditionMatcher<${coverable.Condition.EntityName}> {
  construct(owner: entity.${coverable.Condition.EntityName}) {
    super(owner)
  }

  override property get Parent(): ILinkPropertyInfo {
    return ${coverable.Condition.EntityName}.Type.TypeInfo.getProperty("${coverable.Condition.FkFieldToCoverable.Name}") as ILinkPropertyInfo
  }

}

