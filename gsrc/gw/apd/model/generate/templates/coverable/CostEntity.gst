<%
uses gw.apd.model.generate.templates.TemplateComparators
%>
<%@ params(coverable : APDCoverable, isCoverageCost : boolean, exposureBasis : Set<APDExposure>, coverableBasis : Set<APDCoverable>) %>
<%
uses gw.apd.APDConstants
uses org.apache.commons.lang.StringEscapeUtils

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}.${APDConstants.FINANCIALS}"
var extPackage = "${coverable.LOBPackageName}.${APDConstants.FINANCIALS}"
var coverableQualifiedName = coverable.QualifiedName + (isCoverageCost ? "Cov" : "")

var sortedCblBasis = coverableBasis.toTypedArray().sort(TemplateComparators.CoverableOrdering)
var sortedExpBasis = exposureBasis.toTypedArray().sort(TemplateComparators.ExposureOrdering)
%>
<?xml version="1.0"?>
<subtype
  xmlns="http://guidewire.com/datamodel"
  desc="${StringEscapeUtils.escapeXml(coverable.Name)} unit of premium or other cost (taxes, fees, etc.)<%if(isCoverageCost){%> for coverages.<%}%>"
  entity="${coverableQualifiedName}Cost"
  supertype="${coverable.LinePrefix}Cost">
  <implementsEntity
    name="Cost"/>
  <implementsInterface
    iface="gw.api.domain.financials.CostAdapter"
    impl="${extPackage}.${coverable.LinePrefix}CostAdapter"/>
  <implementsInterface
    iface="${basePackage}.${coverable.LinePrefix}CostMethods"
    impl="${extPackage}.${coverableQualifiedName}CostMethodsImpl"/>
<%if (isCoverageCost or not (coverable typeis APDProductLine)) {%>
  <foreignkey
    desc="${StringEscapeUtils.escapeXml(coverable.Description)}<%if(isCoverageCost){%> coverages<%}%> to which this premium etc. applies"
    exportable="true"
    fkentity="${coverableQualifiedName}"
    name="${coverableQualifiedName}"
    nullok="false"/>
<%}%>
<%for(expBasis in sortedExpBasis){%>
  <foreignkey
    desc="${StringEscapeUtils.escapeXml(expBasis.Description)} to which this premium etc. applies"
    exportable="true"
    fkentity="${coverable.LinePrefix}${expBasis.TypeName}"
    name="${coverable.LinePrefix}${expBasis.TypeName}"
    nullok="true"/>
<%}%>
<%for(cblBasis in sortedCblBasis.where(\cbl -> not (cbl typeis APDProductLine))){%>
  <foreignkey
    desc="${StringEscapeUtils.escapeXml(cblBasis.Description)} to which this premium etc. applies"
    exportable="true"
    fkentity="${coverable.LinePrefix}${cblBasis.TypeName}"
    name="${coverable.LinePrefix}${cblBasis.TypeName}"
    nullok="true"/>
<%}%>
</subtype>