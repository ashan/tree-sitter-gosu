<%@ params(exposure : APDExposure) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${exposure.Coverable.LinePrefixLowerCase}"
%>
${BaseSyncableAdapter.renderToString(basePackage, exposure.QualifiedName, exposure.Fields)}
  override property get SyncableChildren() : List<SyncableAdapter> {
    return {}
  }

}
