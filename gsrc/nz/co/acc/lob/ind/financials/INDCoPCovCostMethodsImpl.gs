package nz.co.acc.lob.ind.financials

uses gw.api.util.JurisdictionMappingUtil

@Export
class INDCoPCovCostMethodsImpl extends GenericINDCostMethodsImpl<INDCoPLiableEarningsCost> {

  construct(owner: entity.INDCoPLiableEarningsCost) {
    super(owner)
  }

  override property get Coverage(): Coverage {
    return null
  }

  override property get OwningCoverable(): INDCoPCov {
    return _owner.INDCoPCov
  }

  override property get Jurisdiction(): Jurisdiction {
    return _owner.INDCoPCov.INDCoPLine.BaseState
  }

}