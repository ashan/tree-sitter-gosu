<% uses gw.acc.npg.model.ProductLine %>
<% uses gw.acc.npg.model.Coverable %>
<%@ params(coverable:Coverable, lineTypeKeyName:String) %>
package ${coverable.LOBPackageName}

uses gw.api.domain.CoverableAdapter
uses java.util.Date
uses java.util.HashSet
uses gw.policy.PolicyLineConfiguration
uses gw.api.util.JurisdictionMappingUtil

@Export
class ${coverable.CoverableAdapterImplName} implements CoverableAdapter {

  var _owner: entity.${coverable.EntityName}

  construct(owner: entity.${coverable.EntityName}) {
    _owner = owner
  }

  override property get PolicyLine(): PolicyLine {
<%if(coverable typeis ProductLine){%>
    return _owner
<%}else{%>
    return _owner.${coverable.PathToLine}
<%}%>
  }
${JurisdictionFunctionImpl.renderToString(coverable, "State",coverable.PathToJurisdiction)}

  override property get PolicyLocations(): PolicyLocation[] {
<%if(coverable typeis ProductLine){%>
    var locs = new HashSet<PolicyLocation>()
<%if (coverable.AttachToLocation) {%>
    locs.addAll((_owner.${coverable.Coverables.get(0).asReferenceArrayField().Name}*.${coverable.LocationFkField.Name}).toSet())
<%} else if (coverable.AttachToBuilding) {%>
    locs.addAll((_owner.${coverable.Coverables.get(0).asReferenceArrayField().Name}*.${coverable.BuildingsFkField.Name}*.PolicyLocation).toSet())
<%}%>
    return locs.toTypedArray()
<%}else{%>
<%if (coverable.AttachToLocation) {%>
    return new PolicyLocation[] {_owner.${coverable.LocationFkField.Name}}
<%} else if (coverable.AttachToBuilding) {%>
    return new PolicyLocation[] {_owner.${coverable.BuildingsFkField.Name}.PolicyLocation}
<%} else {%>
    return null
<%}%>
<%}%>
  }

  override function addCoverage( p0: Coverage ): void {
    _owner.addTo${coverable.CoverageArrayColumnName}( p0 as ${coverable.Coverage.EntityName} )
  }

  override function removeCoverage( p0: Coverage ): void {
    _owner.removeFrom${coverable.CoverageArrayColumnName}( p0 as ${coverable.Coverage.EntityName} )
  }

  override property get CoveragesFromCoverable(): Coverage[] {
    return _owner.${coverable.CoverageArrayColumnName}
  }

<%if(coverable.IncludeExclusion){%>
  override property get ExclusionsFromCoverable(): Exclusion[] {
    return new Exclusion[0]
  }

  override function addExclusion( p0: Exclusion ): void {
    _owner.addTo${coverable.ExclusionArrayColumnName}( p0 as ${coverable.Exclusion.EntityName} )
  }

  override function removeExclusion( p0: Exclusion ): void {
    _owner.removeFrom${coverable.ExclusionArrayColumnName}( p0 as ${coverable.Exclusion.EntityName} )
  }
<%} else {%>
  override property get ExclusionsFromCoverable() : Exclusion[] {
    return new Exclusion[] {}
  }

  override function addExclusion( p0: Exclusion ) : void {
    // do nothing
  }

  override function removeExclusion( p0: Exclusion ) : void {
    // do nothing
  }
<%}%>

<%if(coverable.IncludeCondition){%>
  override property get ConditionsFromCoverable(): PolicyCondition[] {
    return new PolicyCondition[0]
  }

  override function addCondition( p0: PolicyCondition ): void {
    _owner.addTo${coverable.ConditionArrayColumnName}( p0 as ${coverable.Condition.EntityName} )
  }

  override function removeCondition( p0: PolicyCondition ): void {
    _owner.removeFrom${coverable.ConditionArrayColumnName}( p0 as ${coverable.Condition.EntityName} )
  }
<%} else {%>
  override property get ConditionsFromCoverable() : PolicyCondition[] {
    return new PolicyCondition[] {}
  }

  override function addCondition( p0: PolicyCondition ) : void {
    // do nothing
  }

  override function removeCondition( p0: PolicyCondition ) : void {
    // do nothing
  }
<%}%>

  override property get ReferenceDateInternal(): Date {
    return _owner.ReferenceDateInternal
  }

  override property set ReferenceDateInternal( date: Date ) {
    _owner.ReferenceDateInternal = date
  }

  override property get DefaultCurrency(): Currency {
    return _owner.Branch.PreferredCoverageCurrency
  }

  override property get AllowedCurrencies(): List<Currency> {
    return PolicyLineConfiguration.getByLine(InstalledPolicyLine.${lineTypeKeyName}).AllowedCurrencies
  }
}
