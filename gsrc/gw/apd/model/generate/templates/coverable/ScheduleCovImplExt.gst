<%@ params(coverable : APDCoverable) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}"
var extPackage = coverable.LOBPackageName
%>
package ${extPackage}

uses ${basePackage}.${coverable.QualifiedName}ScheduleCovImplBase

@Export
class ${coverable.QualifiedName}ScheduleCovImpl extends ${coverable.QualifiedName}ScheduleCovImplBase {

  construct(owner : entity.${coverable.QualifiedName}ScheduleCov) {
    super(owner)
  }

}