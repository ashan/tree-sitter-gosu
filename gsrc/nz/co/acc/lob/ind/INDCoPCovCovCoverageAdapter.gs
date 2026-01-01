package nz.co.acc.lob.ind

uses gw.coverage.CoverageAdapterBase
uses gw.api.reinsurance.ReinsurableCoverable
uses gw.api.util.JurisdictionMappingUtil

@Export
class INDCoPCovCovCoverageAdapter extends CoverageAdapterBase {

  var _owner: entity.INDCoPCovCov

  construct(owner: entity.INDCoPCovCov) {
    super(owner)
    _owner = owner
  }

  override property get CoverageState(): Jurisdiction {
    return _owner.INDCoPCov.INDCoPLine.BaseState
  }

  override property get PolicyLine(): PolicyLine {
    return (_owner.INDCoPCov.INDCoPLine)
  }

  override property get OwningCoverable(): Coverable {
    return (_owner.INDCoPCov)
  }

  override function addToCoverageArray(p0: Coverage): void {
    _owner.INDCoPCov.addToCoverages(p0 as INDCoPCovCov)
  }

  override function removeFromParent(): void {
    _owner.INDCoPCov.removeFromCoverages(_owner)
  }

  override property get ReinsurableCoverable(): ReinsurableCoverable {
    return _owner.BranchValue
  }
}