<% uses gw.acc.npg.model.Coverable %>
<%@ params(coverable:Coverable) %>
package ${coverable.LOBPackageName}
uses gw.api.domain.RateFactorAdapter

@Export
class ${coverable.RateFactor.RateFactorAdapterImplName} implements RateFactorAdapter {
  var _owner: ${coverable.RateFactor.EntityName}

  construct(rateFactor: ${coverable.RateFactor.EntityName}) {
    _owner = rateFactor
  }

  override property get Modifier(): Modifier {
    return _owner.${coverable.RateFactor.ModifierFkField.Name}
  }
}