<%
uses gw.apd.model.generate.templates.TemplateComparators
%>
<%@ params(coverable : APDCoverable, coverableBasis : Set<APDCoverable>, exposureBasis : Set<APDExposure>) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}.${APDConstants.FINANCIALS}"
%>
package ${basePackage}

@Export
class ${coverable.QualifiedName}CovCostMethodsImplBase extends ${coverable.LinePrefix}CostMethodsImplBase<${coverable.QualifiedName}CovCost> {

  construct(covCost : ${coverable.QualifiedName}CovCost) {
    super(covCost)
  }

  override property get Coverage() : Coverage {
    return (Cost as ${coverable.QualifiedName}CovCost).${coverable.QualifiedName}Cov
  }

  override property get OwningCoverable() : Coverable {
    return (Coverage as ${coverable.QualifiedName}Cov).${coverable.TypeName}
  }

  override property get Jurisdiction() : Jurisdiction {
<%if (exposureBasis.Count > 0) {%>
    // use jurisdiction from exposure if populated (assume only one is used for any cost)
<%for (exposure in exposureBasis.toTypedArray().sort(TemplateComparators.ExposureOrdering)) {%>
    if ((Cost as ${coverable.QualifiedName}CovCost).${coverable.LinePrefix}${exposure.TypeName} != null) {
<%if (exposure.RiskLocation == APDRiskLocationType.TC_REFLOCATION) {%>
      return gw.api.util.JurisdictionMappingUtil.getJurisdiction((Cost as ${coverable.QualifiedName}CovCost).${coverable.LinePrefix}${exposure.TypeName}.${exposure.LocationField})
<%} else {%>
      return (Cost as ${coverable.QualifiedName}CovCost).${coverable.LinePrefix}${exposure.TypeName}.${exposure.Coverable.TypeName}${exposure.Coverable.ReferenceToJurisdiction}
<%}%>
    }
<%}%>
<%}%>
<%if (coverableBasis.Count > 0) {%>
    // use jurisdiction from another coverable, not the coverage parent, if populated (assume only one is used for any cost)
<%for (cbl in coverableBasis.toTypedArray().sort(TemplateComparators.CoverableOrdering)) {%>
    if ((Cost as ${coverable.QualifiedName}CovCost).${cbl.QualifiedName} != null) {
      return (Cost as ${coverable.QualifiedName}CovCost).${cbl.QualifiedName}${coverable.ReferenceToJurisdiction}
    }
<%}%>
<%}%>
    return OwningCoverable.CoverableState
  }

}