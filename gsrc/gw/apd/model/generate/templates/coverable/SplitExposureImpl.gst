<%
uses gw.apd.model.generate.templates.TemplateComparators
%>
<%@ params(exposure : APDExposure) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${exposure.Coverable.LinePrefixLowerCase}"
%>
package ${basePackage}

uses gw.lob.apd.APDFieldAccessor
uses gw.lob.apd.APDInstalledSplitFieldAccessor
uses gw.lob.apd.APDSplittableRiskBase

@Export
class ${exposure.QualifiedName}SplittableBase extends APDSplittableRiskBase {

  construct(owner : entity.${exposure.QualifiedName}) {
    _owner = owner
  }

  override property get SplittableFields() : APDFieldAccessor[] {
<%var fields = exposure.Fields.where(\elt -> elt.SplitByRatingPeriods).sort(TemplateComparators.AttributeOrdering)%>
    var splittableFields = {
<%for (f in fields index i) {%>
      new APDInstalledSplitFieldAccessor(entity.${exposure.QualifiedName}#${f.Name}.PropertyInfo)<%if (i+1 < fields.Count) {%>,<%}%>
<%}%>
    }
    return splittableFields.toTypedArray()
  }

}