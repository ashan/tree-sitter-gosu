<% uses gw.acc.npg.model.Coverable %>
<%@ params(coverable:Coverable) %>
package ${coverable.LOBPackageName}
uses gw.lob.common.AbstractModifierMatcher
uses java.lang.Iterable
uses gw.entity.ILinkPropertyInfo

@Export
class ${coverable.Modifier.ModifierMatcherImplName} extends AbstractModifierMatcher<${coverable.Modifier.EntityName}> {
  construct(owner : ${coverable.Modifier.EntityName}) {
    super(owner)
  }

  override property get ParentColumns() : Iterable<ILinkPropertyInfo> {
    return {${coverable.Modifier.EntityName}.Type.TypeInfo.getProperty("${coverable.Modifier.FkFieldToCoverable.Name}") as ILinkPropertyInfo}
  }
}