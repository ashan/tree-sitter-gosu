<%@ params(coverable : APDCoverable) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}"
var extPackage = coverable.LOBPackageName
%>
package ${extPackage}

uses ${basePackage}.${coverable.QualifiedName}ScheduleCovItemMatcherBase

@Export
class ${coverable.QualifiedName}ScheduleCovItemMatcher extends ${coverable.QualifiedName}ScheduleCovItemMatcherBase {

  construct(owner : entity.${coverable.QualifiedName}ScheduleCovItem) {
    super(owner)
  }

}