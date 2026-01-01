<%@ params(coverable : APDCoverable) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}"
var extPackage = coverable.LOBPackageName
%>
package ${extPackage}

uses ${basePackage}.${coverable.QualifiedName}CondMatcherBase

@Export
class ${coverable.QualifiedName}CondMatcher extends ${coverable.QualifiedName}CondMatcherBase {

  construct(owner : entity.${coverable.QualifiedName}Cond) {
    super(owner)
  }

}