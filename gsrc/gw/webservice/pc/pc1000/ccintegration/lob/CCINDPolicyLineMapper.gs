package gw.webservice.pc.pc1000.ccintegration.lob

uses gw.webservice.pc.pc1000.ccintegration.CCBasePolicyLineMapper
uses gw.webservice.pc.pc1000.ccintegration.CCPolicyGenerator
uses entity.PolicyLine
uses productmodel.INDCoPLine

@Export
class CCINDPolicyLineMapper extends CCBasePolicyLineMapper {

  var _indLine: INDCoPLine
  var _RUCount: Integer
  var _skipCount: Integer;

  construct(line: PolicyLine, policyGen: CCPolicyGenerator) {
    super(line, policyGen)
    _indLine = line as INDCoPLine
  }

  override function getLineCoverages(): List<Coverage> {
    return _indLine.INDLineCoverages?.toList()
  }

  override function createRiskUnits() {
    // Keep a count as we add risk units.  This may start > 0 if other lines have been processed first.
    _RUCount = _ccPolicy.RiskUnits.Count;
    var startingCount = _RUCount
    _skipCount = 0;
    addToPropertiesCount(_RUCount - startingCount + _skipCount)
  }

}