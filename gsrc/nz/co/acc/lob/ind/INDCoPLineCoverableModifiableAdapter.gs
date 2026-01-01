package nz.co.acc.lob.ind

uses gw.api.domain.ModifiableAdapter
uses java.util.Date
uses gw.api.util.JurisdictionMappingUtil

@Export
class INDCoPLineCoverableModifiableAdapter implements gw.api.domain.CoverableAdapter, ModifiableAdapter {
  delegate _coverableAdapter represents gw.api.domain.CoverableAdapter
  delegate _modifiableAdapter represents ModifiableAdapter

  construct(owner: entity.INDCoPLine) {
    _coverableAdapter = new INDCoPLineCoverableAdapter (owner)
    _modifiableAdapter = new INDCoPLineModifiableAdapter (owner)
  }

  override property get PolicyLine(): PolicyLine {
    return _coverableAdapter.PolicyLine
  }

  override property  get State(): Jurisdiction {
    return _coverableAdapter.State
  }
}