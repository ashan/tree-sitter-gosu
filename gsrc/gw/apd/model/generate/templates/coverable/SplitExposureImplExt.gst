<%@ params(exposure : APDExposure) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${exposure.Coverable.LinePrefixLowerCase}"
var extPackage = exposure.Coverable.LOBPackageName
%>
package ${extPackage}

uses ${basePackage}.${exposure.QualifiedName}SplittableBase

@Export
class ${exposure.QualifiedName}Splittable extends ${exposure.QualifiedName}SplittableBase {

  construct(owner : entity.${exposure.QualifiedName}) {
    super(owner)
  }

}