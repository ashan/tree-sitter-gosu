<%
uses gw.apd.model.generate.templates.TemplateComparators
%>
<%@ params(coverable : APDCoverable) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}"
%>
${BaseSyncableAdapter.renderToString(basePackage, coverable.QualifiedName, coverable.Fields)}
  override property get SyncableChildren() : List<SyncableAdapter> {
    var syncableChildren : List<SyncableAdapter> = {}

<%for(var cbl in coverable.ChildCoverables.sort(TemplateComparators.CoverableOrdering)){%>
    syncableChildren.addAll(_owningEntity.${cbl.QualifiedName}s.whereTypeIs(SyncableAdapter).toList())

<%}%>
<%for(var exp in coverable.Exposures.sort(TemplateComparators.ExposureOrdering)){%>
    syncableChildren.addAll(_owningEntity.${exp.QualifiedName}s.whereTypeIs(SyncableAdapter).toList())

<%}%>
    return syncableChildren
  }

}
