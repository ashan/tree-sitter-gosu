<%@ params(coverable : APDCoverable) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}"
var extPackage = coverable.LOBPackageName
%>
package ${extPackage}

uses ${basePackage}.${coverable.QualifiedName}ExclMatcherBase

@Export
class ${coverable.QualifiedName}ExclMatcher extends ${coverable.QualifiedName}ExclMatcherBase {

  construct(owner : entity.${coverable.QualifiedName}Excl) {
    super(owner)
  }

}