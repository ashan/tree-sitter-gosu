package nz.co.acc.lob.shc

uses gw.coverage.CoverageAdapterBase
uses gw.api.reinsurance.ReinsurableCoverable
uses gw.api.util.JurisdictionMappingUtil

@Export
class CWPSCovCovCoverageAdapter extends CoverageAdapterBase {

  var _owner: entity.CWPSCovCov

  construct(owner: entity.CWPSCovCov) {
    super(owner)
    _owner = owner
  }

  override property get CoverageState(): Jurisdiction {
    return _owner.CWPSCov.CWPSLine.BaseState
  }

  override property get PolicyLine(): PolicyLine {
    return (_owner.CWPSCov.CWPSLine)
  }

  override property get OwningCoverable(): Coverable {
    return (_owner.CWPSCov)
  }

  override function addToCoverageArray(p0: Coverage): void {
    _owner.CWPSCov.addToCoverages(p0 as CWPSCovCov)
  }

  override function removeFromParent(): void {
    _owner.CWPSCov.removeFromCoverages(_owner)
  }

  override property get ReinsurableCoverable(): ReinsurableCoverable {
    return _owner.BranchValue
  }
}