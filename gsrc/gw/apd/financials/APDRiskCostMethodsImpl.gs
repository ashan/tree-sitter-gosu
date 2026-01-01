package gw.apd.financials

uses entity.APDRiskCoverable

@Export
class APDRiskCostMethodsImpl<T extends APDRiskCost> extends APDCostMethodsImpl<APDRiskCost> {

  construct(owner: APDRiskCost) {
    super(owner)
  }

  override property get OwningCoverable(): APDRiskCoverable {
    return (_owner as APDRiskCost).RiskCoverable
  }

  override property get Jurisdiction(): Jurisdiction {
    return _owner.OwningCoverable.CoverableState
  }

}