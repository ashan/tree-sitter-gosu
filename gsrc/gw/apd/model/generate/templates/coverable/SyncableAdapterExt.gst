<%@ params(coverable : APDCoverable) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}"
var extPackage = coverable.LOBPackageName
%>
package ${extPackage}

uses ${basePackage}.${coverable.QualifiedName}SyncableAdapterBase

@Export
class ${coverable.QualifiedName}SyncableAdapter extends ${coverable.QualifiedName}SyncableAdapterBase {

  construct(owner : entity.${coverable.QualifiedName}) {
    super(owner)
  }

}
