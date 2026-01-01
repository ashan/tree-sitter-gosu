<%@ params(coverable : APDCoverable) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}"
var extPackage = coverable.LOBPackageName
%>
package ${extPackage}

uses ${basePackage}.${coverable.QualifiedName}SchCovItemCovMatcherBase

@Export
class ${coverable.QualifiedName}SchCovItemCovMatcher extends ${coverable.QualifiedName}SchCovItemCovMatcherBase {

  construct(owner : entity.${coverable.QualifiedName}SchCovItemCov) {
    super(owner)
  }

}