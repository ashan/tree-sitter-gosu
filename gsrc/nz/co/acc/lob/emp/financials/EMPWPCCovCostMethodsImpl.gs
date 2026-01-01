package nz.co.acc.lob.emp.financials

uses gw.api.util.JurisdictionMappingUtil

@Export
class EMPWPCCovCostMethodsImpl extends GenericEMPCostMethodsImpl<EMPWPCLiableEarningsCost> {

  construct(owner: entity.EMPWPCLiableEarningsCost) {
    super(owner)
  }

  override property get Coverage(): Coverage {
    return null
  }

  override property get OwningCoverable(): EMPWPCCov {
    return _owner.EMPWPCCov
  }

  override property get Jurisdiction(): Jurisdiction {
    return _owner.EMPWPCCov.EMPWPCLine.BaseState
  }

}