<% uses gw.acc.npg.model.Coverable %>
<%@ params(coverable:Coverable) %>
package ${coverable.LOBPackageName}
uses gw.api.domain.ModifierAdapter

@Export
class ${coverable.Modifier.ModifierAdapterImplName} implements ModifierAdapter {
  var _owner: entity.${coverable.Modifier.EntityName}

  construct(owner: entity.${coverable.Modifier.EntityName}) {
    _owner = owner
  }

  override property get OwningModifiable(): Modifiable {
    return _owner.${coverable.Modifier.FkFieldToCoverable.Name}
  }

  override property get RateFactors(): RateFactor[] {
    return _owner.${coverable.Modifier.RateFactorArrayColumnName}
  }

  override function addToRateFactors(p0: RateFactor) {
    _owner.addTo${coverable.Modifier.RateFactorArrayColumnName}(p0 as ${coverable.RateFactor.EntityName})
  }

  override function createRawRateFactor(): RateFactor {
    return new ${coverable.RateFactor.EntityName}(_owner.Branch)
  }

  override function removeFromRateFactors(p0: RateFactor) {
    _owner.removeFrom${coverable.Modifier.RateFactorArrayColumnName}(p0 as ${coverable.RateFactor.EntityName})
  }
}