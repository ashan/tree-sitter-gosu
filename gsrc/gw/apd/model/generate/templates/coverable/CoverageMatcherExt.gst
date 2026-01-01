<%@ params(coverable : APDCoverable) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}"
var extPackage = coverable.LOBPackageName
%>
package ${extPackage}

uses ${basePackage}.${coverable.QualifiedName}CovMatcherBase

@Export
class ${coverable.QualifiedName}CovMatcher extends ${coverable.QualifiedName}CovMatcherBase {

  construct(owner : entity.${coverable.QualifiedName}Cov) {
    super(owner)
  }

}