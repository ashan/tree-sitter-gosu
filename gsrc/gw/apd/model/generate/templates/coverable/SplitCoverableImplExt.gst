<%@ params(coverable : APDCoverable) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}"
var extPackage = coverable.LOBPackageName
%>
package ${extPackage}

uses ${basePackage}.${coverable.QualifiedName}SplittableBase

@Export
class ${coverable.QualifiedName}Splittable extends ${coverable.QualifiedName}SplittableBase {

  construct(owner : entity.${coverable.QualifiedName}) {
    super(owner)
  }

}