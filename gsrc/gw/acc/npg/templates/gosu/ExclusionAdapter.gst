<% uses gw.acc.npg.model.ProductLine %>
<% uses gw.acc.npg.model.Coverable %>
<%@ params(coverable:Coverable) %>
package ${coverable.LOBPackageName}
uses gw.coverage.ExclusionAdapterBase
uses gw.api.util.JurisdictionMappingUtil

@Export
class ${coverable.Exclusion.ExclusionAdapterImplName} extends ExclusionAdapterBase {
  var _owner: entity.${coverable.Exclusion.EntityName}

  construct(owner: entity.${coverable.Exclusion.EntityName}) {
    super(owner)
    _owner = owner
  }
${JurisdictionFunctionImpl.renderToString(coverable, "CoverageState",coverable.Exclusion.PathToJurisdiction)}

  override property get PolicyLine(): PolicyLine {
<%if(coverable typeis ProductLine){%>
    return _owner.${coverable.Exclusion.FkFieldToCoverable.Name}
<%}else{%>
    return _owner.${coverable.Exclusion.FkFieldToCoverable.Name}.${coverable.PathToLine}
<%}%>
  }

  override property get OwningCoverable(): Coverable {
    return _owner.${coverable.Exclusion.FkFieldToCoverable.Name}
  }

  override function addToExclusionArray( p0: Exclusion ): void {
    _owner.${coverable.Exclusion.FkFieldToCoverable.Name}.addTo${coverable.ExclusionArrayColumnName}( p0 as ${coverable.Exclusion.EntityName} )
  }

  override function removeFromParent(): void {
    _owner.${coverable.Exclusion.FkFieldToCoverable.Name}.removeFrom${coverable.ExclusionArrayColumnName}( _owner )
  }

}