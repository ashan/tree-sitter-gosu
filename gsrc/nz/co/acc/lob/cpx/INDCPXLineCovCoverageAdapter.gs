package nz.co.acc.lob.cpx

uses gw.coverage.CoverageAdapterBase
uses gw.api.reinsurance.ReinsurableCoverable
uses gw.api.util.JurisdictionMappingUtil

@Export
class INDCPXLineCovCoverageAdapter extends CoverageAdapterBase {

  var _owner: entity.INDCPXLineCov

  construct(owner: entity.INDCPXLineCov) {
    super(owner)
    _owner = owner
  }

  override property get CoverageState(): Jurisdiction {
    return _owner.INDCPXLine.BaseState
  }

  override property get PolicyLine(): PolicyLine {
    return (_owner.INDCPXLine)
  }

  override property get OwningCoverable(): Coverable {
    return (_owner.INDCPXLine)
  }

  override function addToCoverageArray(p0: Coverage): void {
    _owner.INDCPXLine.addToCPXLineCoverages(p0 as INDCPXLineCov)
  }

  override function removeFromParent(): void {
    _owner.INDCPXLine.removeFromCPXLineCoverages(_owner)
  }

  override property get ReinsurableCoverable(): ReinsurableCoverable {
    return _owner.BranchValue
  }
}