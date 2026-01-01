package gw.webservice.pc.pc900.ccintegration.lob

uses gw.webservice.pc.pc900.ccintegration.CCBasePolicyLineMapper
uses gw.webservice.pc.pc900.ccintegration.CCPolicyGenerator
uses gw.webservice.pc.pc900.ccintegration.entities.types.complex.CCLocationMiscRU
uses gw.webservice.pc.pc900.ccintegration.entities.types.complex.CCPropertyCoverage
uses gw.webservice.pc.pc900.ccintegration.entities.anonymous.elements.CCPolicy_RiskUnits
uses gw.webservice.pc.pc900.ccintegration.entities.anonymous.elements.CCRiskUnit_Coverages

uses java.lang.Integer

uses nz.co.acc.lob.cpx.financials.CPXQuoteDisplayUtil

@Export
class CCCPXPolicyLineMapper extends CCBasePolicyLineMapper {

  var _cpxLine: INDCPXLine
  var _RUCount: Integer
  var _skipCount: Integer;

  construct(line: PolicyLine, policyGen: CCPolicyGenerator) {
    super(line, policyGen)
    _cpxLine = line as INDCPXLine
  }

  override function getLineCoverages(): List<entity.Coverage> {
    return _cpxLine.CPXLineCoverages?.toList()
  }

  override function createRiskUnits() {
    // Keep a count as we add risk units.  This may start > 0 if other lines have been processed first.
    _RUCount = _ccPolicy.RiskUnits.Count;
    var startingCount = _RUCount
    _skipCount = 0;
    addToPropertiesCount(_RUCount - startingCount + _skipCount)
  }

}