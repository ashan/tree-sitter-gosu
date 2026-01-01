<%
uses gw.apd.model.generate.APDGosuReferencesHelper
%>
<%@ params(coverable:APDCoverable) %>
package ${coverable.LOBPackageName}

uses gw.api.domain.ModifiableAdapter
uses java.util.Date
uses gw.api.util.JurisdictionMappingUtil

@Export
class ${coverable.LinePrefix}${coverable.TypeName}ModifiableAdapter implements ModifiableAdapter {
  var _owner: entity.ModifiableAdapter

  construct(owner: entity.ModifiableAdapter) {
    _owner = owner
  }

  override property get AllModifiers(): Modifier[] {
    return _owner.Modifiers
  }

  override property get PolicyLine(): PolicyLine {
    return _owner${ APDGosuReferencesHelper.getReferenceToLine(coverable)}
  }

  override property get PolicyPeriod(): PolicyPeriod {
    return _owner.Branch
  }

  override property get State() : Jurisdiction {
<%if (coverable.Parent == null) { // this is the line %>
    return _owner.BaseState
<%} else if(coverable.RiskLocation == APDRiskLocationType.TC_ISLOCATION){%>
    return JurisdictionMappingUtil.getJurisdiction(_owner.Location)
<%} else if(coverable.RiskLocation == APDRiskLocationType.TC_ISBUILDING){%>
    return JurisdictionMappingUtil.getJurisdiction(_owner.Building.PolicyLocation)
<%} else if(coverable.RiskLocation == APDRiskLocationType.TC_USEPARENT){%>
    return _owner.${coverable.Parent.TypeName}.State
<%} else { // references a location using a field%>
    return JurisdictionMappingUtil.getJurisdiction(_owner.${coverable.Fields.firstWhere(\f -> f.Jurisdiction).Name})
<%}%>
  }
  override function addToModifiers(p0: Modifier) {
    _owner.addToModifiers(p0 as ${coverable.LinePrefix}${coverable.TypeName}Mod)
  }

  override function removeFromModifiers(p0: Modifier) {
    _owner.removeFromModifiers(p0 as ${coverable.LinePrefix}${coverable.TypeName}Mod)
  }

  override function createRawModifier(): Modifier {
    return new ${coverable.LinePrefix}${coverable.TypeName}Mod(_owner.Branch)
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