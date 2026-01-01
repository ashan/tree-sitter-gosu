<% uses gw.acc.npg.model.ProductLine %>
<% uses gw.acc.npg.model.Coverable %>
<%@ params(coverable:Coverable) %>
package ${coverable.LOBPackageName}
uses gw.coverage.ConditionAdapterBase
uses gw.api.util.JurisdictionMappingUtil

@Export
class ${coverable.Condition.ConditionAdapterImplName} extends ConditionAdapterBase {
  var _owner: entity.${coverable.Condition.EntityName}

  construct(owner: entity.${coverable.Condition.EntityName}) {
    super(owner)
    _owner = owner
  }
${JurisdictionFunctionImpl.renderToString(coverable, "CoverageState",coverable.Condition.PathToJurisdiction)}

  override property get PolicyLine(): PolicyLine {
<%if(coverable typeis ProductLine){%>
    return _owner.${coverable.Condition.FkFieldToCoverable.Name}
<%}else{%>
    return _owner.${coverable.Condition.FkFieldToCoverable.Name}.${coverable.PathToLine}
<%}%>
  }

  override property get OwningCoverable(): Coverable {
    return _owner.${coverable.Condition.FkFieldToCoverable.Name}
  }

  override function addToConditionArray( p0: PolicyCondition ): void {
    _owner.${coverable.Condition.FkFieldToCoverable.Name}.addTo${coverable.ConditionArrayColumnName}( p0 as ${coverable.Condition.EntityName} )
  }

  override function removeFromParent(): void {
    _owner.${coverable.Condition.FkFieldToCoverable.Name}.removeFrom${coverable.ConditionArrayColumnName}( _owner )
  }

}
