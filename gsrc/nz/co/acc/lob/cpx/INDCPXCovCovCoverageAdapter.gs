package nz.co.acc.lob.cpx

uses gw.coverage.CoverageAdapterBase
uses gw.api.reinsurance.ReinsurableCoverable
uses gw.api.util.JurisdictionMappingUtil

@Export
class INDCPXCovCovCoverageAdapter extends CoverageAdapterBase {

  var _owner: entity.INDCPXCovCov

  construct(owner: entity.INDCPXCovCov) {
    super(owner)
    _owner = owner
  }

  override property get CoverageState(): Jurisdiction {
    return _owner.INDCPXCov.INDCPXLine.BaseState
  }

  override property get PolicyLine(): PolicyLine {
    return (_owner.INDCPXCov.INDCPXLine)
  }

  override property get OwningCoverable(): Coverable {
    return (_owner.INDCPXCov)
  }

  override function addToCoverageArray(p0: Coverage): void {
    _owner.INDCPXCov.addToCoverages(p0 as INDCPXCovCov)
  }

  override function removeFromParent(): void {
    _owner.INDCPXCov.removeFromCoverages(_owner)
  }

  override property get ReinsurableCoverable(): ReinsurableCoverable {
    return _owner.BranchValue
  }
}