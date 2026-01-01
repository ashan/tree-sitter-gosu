package gw.apd

uses gw.coverage.CoverageAdapterBase

@Export
class APDRiskCoverageAdapter extends CoverageAdapterBase {
  var _owner : APDRiskCoverage

  construct(owner : APDRiskCoverage)
  {
    super(owner)
    _owner = owner
  }

  override function addToCoverageArray(coverage : Coverage) {

  }

  override function removeFromParent() {

  }

  override property get CoverageState() : Jurisdiction {
    return _owner.RiskCoverable.CoverableState
  }

  override property get OwningCoverable() : Coverable {
    return _owner.RiskCoverable
  }

  override property get PolicyLine() : PolicyLine {
    return _owner.RiskCoverable.ManualPolicyLine
  }
}