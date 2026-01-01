package nz.co.acc.lob.shc

uses gw.coverage.CoverageAdapterBase
uses gw.api.reinsurance.ReinsurableCoverable
uses gw.api.util.JurisdictionMappingUtil

@Export
class CWPSLineCovCoverageAdapter extends CoverageAdapterBase {

  var _owner: entity.CWPSLineCov

  construct(owner: entity.CWPSLineCov) {
    super(owner)
    _owner = owner
  }

  override property get CoverageState(): Jurisdiction {
    return _owner.CWPSLine.BaseState
  }

  override property get PolicyLine(): PolicyLine {
    return (_owner.CWPSLine)
  }

  override property get OwningCoverable(): Coverable {
    return (_owner.CWPSLine)
  }

  override function addToCoverageArray(p0: Coverage): void {
    _owner.CWPSLine.addToSHCLineCoverages(p0 as CWPSLineCov)
  }

  override function removeFromParent(): void {
    _owner.CWPSLine.removeFromSHCLineCoverages(_owner)
  }

  override property get ReinsurableCoverable(): ReinsurableCoverable {
    return _owner.BranchValue
  }
}