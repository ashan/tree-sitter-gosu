<%@ params(coverable:APDCoverable) %>
package ${coverable.LOBPackageName}

uses gw.api.domain.ModifiableAdapter
uses java.util.Date
uses gw.api.util.JurisdictionMappingUtil

@Export
class ${coverable.LinePrefix}${coverable.TypeName}CoverableModifiableAdapter implements gw.api.domain.CoverableAdapter, ModifiableAdapter {
  delegate _coverableAdapter represents gw.api.domain.CoverableAdapter
  delegate _modifiableAdapter represents ModifiableAdapter

  construct(owner: entity.${coverable.LinePrefix}${coverable.TypeName}) {
    _coverableAdapter = new ${coverable.LinePrefix}${coverable.TypeName}CoverableAdapter(owner)
    _modifiableAdapter = new ${coverable.LinePrefix}${coverable.TypeName}ModifiableAdapter(owner)
  }

  override property get PolicyLine(): PolicyLine {
    return _coverableAdapter.PolicyLine
  }

  override property  get State(): Jurisdiction {
    return _coverableAdapter.State
  }

  override property get ReferenceDateInternal(): Date {
    return _coverableAdapter.ReferenceDateInternal
  }

  override property set ReferenceDateInternal(d: Date)  {
    _coverableAdapter.ReferenceDateInternal = d
  }

<%if(coverable.Parent != null){%>
  override property get PolicyPeriod(): PolicyPeriod {
    return _modifiableAdapter.PolicyPeriod
  }
<%}%>
}
