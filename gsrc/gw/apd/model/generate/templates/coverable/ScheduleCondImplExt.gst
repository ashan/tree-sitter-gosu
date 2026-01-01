<%@ params(coverable : APDCoverable) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}"
var extPackage = coverable.LOBPackageName
%>
package ${extPackage}

uses ${basePackage}.${coverable.QualifiedName}ScheduleCondImplBase

@Export
class ${coverable.QualifiedName}ScheduleCondImpl extends ${coverable.QualifiedName}ScheduleCondImplBase {

  construct(owner : entity.${coverable.QualifiedName}ScheduleCond) {
    super(owner)
  }

}