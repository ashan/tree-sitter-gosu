package nz.co.acc.lob.emp

uses gw.coverage.CoverageAdapterBase
uses gw.api.reinsurance.ReinsurableCoverable
uses gw.api.util.JurisdictionMappingUtil

@Export
class EMPWPCCovCovCoverageAdapter extends CoverageAdapterBase {

  var _owner: entity.EMPWPCCovCov

  construct(owner: entity.EMPWPCCovCov) {
    super(owner)
    _owner = owner
  }

  override property get CoverageState(): Jurisdiction {
    return _owner.EMPWPCCov.EMPWPCLine.BaseState
  }

  override property get PolicyLine(): PolicyLine {
    return (_owner.EMPWPCCov.EMPWPCLine)
  }

  override property get OwningCoverable(): Coverable {
    return (_owner.EMPWPCCov)
  }

  override function addToCoverageArray(p0: Coverage): void {
    _owner.EMPWPCCov.addToCoverages(p0 as EMPWPCCovCov)
  }

  override function removeFromParent(): void {
    _owner.EMPWPCCov.removeFromCoverages(_owner)
  }

  override property get ReinsurableCoverable(): ReinsurableCoverable {
    return _owner.BranchValue
  }
}