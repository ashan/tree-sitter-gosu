<%@ params(coverable : APDCoverable) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}"
var extPackage = coverable.LOBPackageName
%>
package ${extPackage}

uses ${basePackage}.${coverable.QualifiedName}ScheduleExclImplBase

@Export
class ${coverable.QualifiedName}ScheduleExclImpl extends ${coverable.QualifiedName}ScheduleExclImplBase {

  construct(owner : entity.${coverable.QualifiedName}ScheduleExcl) {
    super(owner)
  }

}