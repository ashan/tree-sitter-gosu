<%@ params(coverable : APDCoverable) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}"
var extPackage = coverable.LOBPackageName
%>
package ${extPackage}

uses ${basePackage}.${coverable.QualifiedName}SchCondItemCondMatcherBase

@Export
class ${coverable.QualifiedName}SchCondItemCondMatcher extends ${coverable.QualifiedName}SchCondItemCondMatcherBase {

  construct(owner : entity.${coverable.QualifiedName}SchCondItemCond) {
    super(owner)
  }

}