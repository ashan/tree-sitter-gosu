package nz.co.acc.lob.ind

uses gw.api.domain.ModifiableAdapter
uses java.util.Date
uses gw.api.util.JurisdictionMappingUtil

@Export
class INDCoPCovCoverableModifiableAdapter implements gw.api.domain.CoverableAdapter, ModifiableAdapter {
  delegate _coverableAdapter represents gw.api.domain.CoverableAdapter
  delegate _modifiableAdapter represents ModifiableAdapter

  construct(owner: entity.INDCoPCov) {
    _coverableAdapter = new INDCoPCovCoverableAdapter (owner)
    _modifiableAdapter = new INDCoPCovModifiableAdapter (owner)
  }

  override property get PolicyLine(): PolicyLine {
    return _coverableAdapter.PolicyLine
  }

  override property  get State(): Jurisdiction {
    return _coverableAdapter.State
  }

  override property get PolicyPeriod(): PolicyPeriod {
    return _modifiableAdapter.PolicyPeriod
  }
}