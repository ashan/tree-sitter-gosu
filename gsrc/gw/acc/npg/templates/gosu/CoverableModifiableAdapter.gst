<% uses gw.acc.npg.model.Coverable %>
<% uses gw.acc.npg.model.ProductLine %>
<%@ params(coverable:Coverable) %>
package ${coverable.LOBPackageName}

uses gw.api.domain.ModifiableAdapter
uses java.util.Date
uses gw.api.util.JurisdictionMappingUtil

@Export
class ${coverable.CoverableModifiableAdapterImplName} implements gw.api.domain.CoverableAdapter, ModifiableAdapter {
  delegate _coverableAdapter represents gw.api.domain.CoverableAdapter
  delegate _modifiableAdapter represents ModifiableAdapter

  construct(owner: entity.${coverable.EntityName}) {
    _coverableAdapter = new ${coverable.CoverableAdapterImplName} (owner)
    _modifiableAdapter = new ${coverable.ModifiableAdapterImplName} (owner)
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

<%if(not (coverable typeis ProductLine)){%>
  override property get PolicyPeriod(): PolicyPeriod {
    return _modifiableAdapter.PolicyPeriod
  }
<%}%>
}
