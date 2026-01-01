<%@ params(coverable : APDCoverable) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}"
var extPackage = coverable.LOBPackageName
%>
package ${extPackage}

uses ${basePackage}.${coverable.QualifiedName}SchExclItemExclMatcherBase

@Export
class ${coverable.QualifiedName}SchExclItemExclMatcher extends ${coverable.QualifiedName}SchExclItemExclMatcherBase {

  construct(owner : entity.${coverable.QualifiedName}SchExclItemExcl) {
    super(owner)
  }

}