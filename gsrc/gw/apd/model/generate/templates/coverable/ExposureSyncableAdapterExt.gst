<%@ params(exposure : APDExposure) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${exposure.Coverable.LinePrefixLowerCase}"
var extPackage = exposure.Coverable.LOBPackageName
%>
package ${extPackage}

uses ${basePackage}.${exposure.QualifiedName}SyncableAdapterBase

@Export
class ${exposure.QualifiedName}SyncableAdapter extends ${exposure.QualifiedName}SyncableAdapterBase {

  construct(owner : entity.${exposure.QualifiedName}) {
    super(owner)
  }

}
