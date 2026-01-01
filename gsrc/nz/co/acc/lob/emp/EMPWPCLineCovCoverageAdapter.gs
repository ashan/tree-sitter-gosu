package nz.co.acc.lob.emp

uses gw.coverage.CoverageAdapterBase
uses gw.api.reinsurance.ReinsurableCoverable
uses gw.api.util.JurisdictionMappingUtil

@Export
class EMPWPCLineCovCoverageAdapter extends CoverageAdapterBase {

  var _owner: entity.EMPWPCLineCov

  construct(owner: entity.EMPWPCLineCov) {
    super(owner)
    _owner = owner
  }

  override property get CoverageState(): Jurisdiction {
    return _owner.EMPWPCLine.BaseState
  }

  override property get PolicyLine(): PolicyLine {
    return (_owner.EMPWPCLine)
  }

  override property get OwningCoverable(): Coverable {
    return (_owner.EMPWPCLine)
  }

  override function addToCoverageArray(p0: Coverage): void {
    _owner.EMPWPCLine.addToEMPLineCoverages(p0 as EMPWPCLineCov)
  }

  override function removeFromParent(): void {
    _owner.EMPWPCLine.removeFromEMPLineCoverages(_owner)
  }

  override property get ReinsurableCoverable(): ReinsurableCoverable {
    return _owner.BranchValue
  }
}