<%@ params(coverable : APDCoverable) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}"
var extPackage = coverable.LOBPackageName
%>
package ${extPackage}

uses ${basePackage}.${coverable.QualifiedName}SchCovItemCovCoverageAdapterBase

@Export
class ${coverable.QualifiedName}SchCovItemCovCoverageAdapter extends ${coverable.QualifiedName}SchCovItemCovCoverageAdapterBase {

  construct(owner : entity.${coverable.QualifiedName}SchCovItemCov) {
    super(owner)
  }

}