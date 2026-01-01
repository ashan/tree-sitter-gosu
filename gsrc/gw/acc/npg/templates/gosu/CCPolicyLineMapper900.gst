<% uses gw.acc.npg.model.ProductLine %>
<%@ params(productLine: ProductLine) %>
package gw.webservice.pc.pc900.ccintegration.lob

uses gw.webservice.pc.pc900.ccintegration.CCBasePolicyLineMapper
uses gw.webservice.pc.pc900.ccintegration.CCPolicyGenerator
uses gw.webservice.pc.pc900.ccintegration.entities.types.complex.CCLocationMiscRU
uses gw.webservice.pc.pc900.ccintegration.entities.types.complex.CCPropertyCoverage
uses gw.webservice.pc.pc900.ccintegration.entities.anonymous.elements.CCPolicy_RiskUnits
uses gw.webservice.pc.pc900.ccintegration.entities.anonymous.elements.CCRiskUnit_Coverages

uses java.lang.Integer

uses ${productLine.LOBPackageName}.financials.${productLine.QuoteDisplayUtilName}

@Export
class ${productLine.CCPolicyLineMapperName} extends CCBasePolicyLineMapper {
<%var lineName = "_${productLine.AbbrevationLowerCase}Line"%>

  var ${lineName}: ${productLine.EntityName}
  var _RUCount: Integer
  var _skipCount: Integer;

  construct(line: PolicyLine, policyGen: CCPolicyGenerator) {
    super(line, policyGen)
    ${lineName} = line as ${productLine.EntityName}
  }

  override function getLineCoverages(): List<entity.Coverage> {
    return ${lineName}.${productLine.CoverageArrayField.Name}?.toList()
  }

  override function createRiskUnits() {
    // Keep a count as we add risk units.  This may start > 0 if other lines have been processed first.
    _RUCount = _ccPolicy.RiskUnits.Count;
    var startingCount = _RUCount
    _skipCount = 0;
<%for(var coverable in productLine.Coverables){%>
<%if(coverable.JurisBasedOnLocation){%>
    for( cbl in ${lineName}.${coverable.PathFromLine} ) {
      var pcLoc = cbl.${coverable.PathToJurisdiction}
      if(meetsLocationFilteringCriteria(pcLoc)) {
        // Get the Location
        var ccLoc = _policyGen.getOrCreateCCLocation( pcLoc )

        // Create a new CC Risk Unit
        var ccLocRU = new CCLocationMiscRU()
        _ccPolicy.RiskUnits.add(new CCPolicy_RiskUnits( ccLocRU ))
        _RUCount = _RUCount + 1
        ccLocRU.RUNumber = _RUCount
        ccLocRU.PolicyLocation = ccLoc
        ccLocRU.PolicySystemID = cbl.TypeIDString
        ccLocRU.OtherRiskType = "other"
        ccLocRU.Description = ${productLine.QuoteDisplayUtilName}.CoverableDisplayName(cbl)
          // Map additional fields here

        // Map coverages for this coverable
        for( pcCov in cbl.Coverages.sortBy(\ c -> c.Pattern.Priority) ) {
          var ccCov = new CCPropertyCoverage()
          populateCoverage(ccCov, pcCov)
          ccLocRU.Coverages.add(new CCRiskUnit_Coverages( ccCov ))
        }

      } else {  // Location is filtered out
        _skipCount = _skipCount + 1;
      }
    }
<%}%>
<%}%>
    addToPropertiesCount(_RUCount - startingCount + _skipCount)
  }

}
