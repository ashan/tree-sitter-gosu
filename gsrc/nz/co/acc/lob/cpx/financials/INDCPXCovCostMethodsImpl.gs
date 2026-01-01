package nz.co.acc.lob.cpx.financials

uses gw.api.util.JurisdictionMappingUtil

@Export
class INDCPXCovCostMethodsImpl extends GenericCPXCostMethodsImpl<INDCPXLiableCost> {

  construct(owner: entity.INDCPXLiableCost) {
    super(owner)
  }

  override property get Coverage(): Coverage {
    return null
  }

  override property get OwningCoverable(): INDCPXCov {
    return _owner.INDCPXCov
  }

  override property get Jurisdiction(): Jurisdiction {
    return _owner.INDCPXCov.INDCPXLine.BaseState
  }

}