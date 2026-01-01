<% uses gw.acc.npg.model.ProductLine %>
<% uses gw.acc.npg.model.Coverable %>
<%@ params(coverable:Coverable) %>
package ${coverable.LOBPackageName}
uses gw.api.domain.ModifiableAdapter
uses java.util.Date
uses gw.api.util.JurisdictionMappingUtil

@Export
class ${coverable.ModifiableAdapterImplName} implements ModifiableAdapter {
  var _owner: entity.${coverable.EntityName}

  construct(owner: entity.${coverable.EntityName}) {
    _owner = owner
  }

  override property get AllModifiers(): Modifier[] {
    return _owner.${coverable.ModifierArrayColumnName}
  }

  override property get PolicyLine(): PolicyLine {
<%if(coverable typeis ProductLine){%>
    return _owner
<%}else{%>
    return _owner.${coverable.PathToLine}
<%}%>
  }

  override property get PolicyPeriod(): PolicyPeriod {
    return _owner.Branch
  }
${JurisdictionFunctionImpl.renderToString(coverable,"State",coverable.PathToJurisdiction)}

  override function addToModifiers(p0: Modifier) {
    _owner.addTo${coverable.ModifierArrayColumnName}(p0 as ${coverable.Modifier.EntityName})
  }

  override function removeFromModifiers(p0: Modifier) {
    _owner.removeFrom${coverable.ModifierArrayColumnName}(p0 as ${coverable.Modifier.EntityName})
  }

  override function createRawModifier(): Modifier {
    return new ${coverable.Modifier.EntityName}(_owner.Branch)
  }

  override function postUpdateModifiers() {
  }

  override property get ReferenceDateInternal(): Date {
    return _owner.ReferenceDateInternal
  }

  override property set ReferenceDateInternal(date: Date) {
    _owner.ReferenceDateInternal = date
  }
}