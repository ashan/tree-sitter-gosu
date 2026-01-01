package nz.co.acc.lob.ind

uses gw.coverage.CoverageAdapterBase
uses gw.api.reinsurance.ReinsurableCoverable
uses gw.api.util.JurisdictionMappingUtil

@Export
class INDCoPLineCovCoverageAdapter extends CoverageAdapterBase {

  var _owner: entity.INDCoPLineCov

  construct(owner: entity.INDCoPLineCov) {
    super(owner)
    _owner = owner
  }

  override property get CoverageState(): Jurisdiction {
    return _owner.INDCoPLine.BaseState
  }

  override property get PolicyLine(): PolicyLine {
    return (_owner.INDCoPLine)
  }

  override property get OwningCoverable(): Coverable {
    return (_owner.INDCoPLine)
  }

  override function addToCoverageArray(p0: Coverage): void {
    _owner.INDCoPLine.addToINDLineCoverages(p0 as INDCoPLineCov)
  }

  override function removeFromParent(): void {
    _owner.INDCoPLine.removeFromINDLineCoverages(_owner)
  }

  override property get ReinsurableCoverable(): ReinsurableCoverable {
    return _owner.BranchValue
  }
}