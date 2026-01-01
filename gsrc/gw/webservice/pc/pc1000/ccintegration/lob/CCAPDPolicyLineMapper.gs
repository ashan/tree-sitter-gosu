package gw.webservice.pc.pc1000.ccintegration.lob

uses entity.PolicyLine
uses gw.webservice.pc.pc1000.ccintegration.CCBasePolicyLineMapper
uses gw.webservice.pc.pc1000.ccintegration.CCPolicyGenerator

@Export
class CCAPDPolicyLineMapper extends CCBasePolicyLineMapper {

  var _apdLine: APDManualPolicyLine
  var _RUCount: Integer
  var _skipCount: Integer;

  construct(line: PolicyLine, policyGen: CCPolicyGenerator) {
    super(line, policyGen)
    _apdLine = line as APDManualPolicyLine
  }

  override function getLineCoverages(): List<Coverage> {
    return new ArrayList<Coverage>()
  }

  override function createRiskUnits() {
    // Keep a count as we add risk units.  This may start > 0 if other lines have been processed first.
    _RUCount = _ccPolicy.RiskUnits.Count;
    var startingCount = _RUCount
    _skipCount = 0;
    addToPropertiesCount(_RUCount - startingCount + _skipCount)
  }

}