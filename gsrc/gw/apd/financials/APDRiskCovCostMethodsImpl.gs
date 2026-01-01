package gw.apd.financials

uses entity.APDRiskCoverable

@Export
class APDRiskCovCostMethodsImpl<T extends APDRiskCovCost> extends APDCostMethodsImpl<APDRiskCovCost> {

  construct(owner: entity.APDRiskCovCost) {
    super(owner)
  }

  override property get OwningCoverable(): APDRiskCoverable {
    return (_owner as APDRiskCovCost).RiskCoverage.RiskCoverable
  }

  override property get Jurisdiction(): Jurisdiction {
    return _owner.OwningCoverable.CoverableState
  }

}