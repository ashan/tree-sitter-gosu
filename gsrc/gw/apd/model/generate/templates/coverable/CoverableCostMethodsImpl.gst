<%@ params(coverable : APDCoverable) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}.${APDConstants.FINANCIALS}"
%>
package ${basePackage}

@Export
class ${coverable.QualifiedName}CostMethodsImplBase extends ${coverable.LinePrefix}CostMethodsImplBase<${coverable.QualifiedName}Cost> {

  construct(cost : ${coverable.QualifiedName}Cost) {
    super(cost)
  }

<%if (coverable.IsACoverable) {%>
  override property get OwningCoverable() : Coverable {
    return (Cost as ${coverable.QualifiedName}Cost).${coverable.QualifiedName}
  }

<%}%>
  override property get Jurisdiction() : Jurisdiction {
<%if(coverable.RiskLocation == APDRiskLocationType.TC_ISLOCATION
  or coverable.RiskLocation == APDRiskLocationType.TC_ISBUILDING
  or coverable.RiskLocation == APDRiskLocationType.TC_REFLOCATION) {
%>
    return gw.api.util.JurisdictionMappingUtil.getJurisdiction((Cost as ${coverable.QualifiedName}Cost).${coverable.QualifiedName}.${coverable.LocationField})
<%} else if (coverable.IsACoverable) {%>
    return OwningCoverable.CoverableState
<%} else if (coverable.JurisdictionReferencesLocation) { // use location from parent %>
    return gw.api.util.JurisdictionMappingUtil.getJurisdiction((Cost as ${coverable.QualifiedName}Cost).${coverable.QualifiedName}${coverable.ReferenceToJurisdiction})
<%} else { // use base state %>
    return (Cost as ${coverable.QualifiedName}Cost).${coverable.QualifiedName}${coverable.ReferenceToJurisdiction}
<%}%>
  }

}