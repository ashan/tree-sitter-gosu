package nz.co.acc.lob.shc.financials

uses gw.api.util.JurisdictionMappingUtil

@Export
class CWPSCovCostMethodsImpl extends GenericSHCCostMethodsImpl<CWPSLiableCost> {

  construct(owner: entity.CWPSLiableCost) {
    super(owner)
  }

  override property get Coverage(): Coverage {
    return null
  }

  override property get OwningCoverable(): CWPSCov {
    return _owner.CWPSCov
  }

  override property get Jurisdiction(): Jurisdiction {
    return _owner.CWPSCov.CWPSLine.BaseState
  }

}