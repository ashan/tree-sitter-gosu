<% uses gw.acc.npg.model.Coverable %>
<%@ params(coverable:Coverable) %>
package ${coverable.LOBPackageName}
uses gw.lob.common.AbstractRateFactorMatcher
uses java.lang.Iterable
uses gw.entity.ILinkPropertyInfo

@Export
class ${coverable.RateFactor.RateFactorMatcherImplName} extends AbstractRateFactorMatcher<${coverable.RateFactor.EntityName}> {

  construct(owner: entity.${coverable.RateFactor.EntityName}) {
    super(owner)
  }

  override property get ParentColumns(): Iterable<ILinkPropertyInfo> {
    return {${coverable.RateFactor.EntityName}.Type.TypeInfo.getProperty("${coverable.RateFactor.ModifierFkField.Name}") as ILinkPropertyInfo};
  }

}
