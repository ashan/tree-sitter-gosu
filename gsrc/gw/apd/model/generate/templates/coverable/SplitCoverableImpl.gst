<%
uses gw.apd.model.generate.templates.TemplateComparators
%>
<%@ params(coverable : APDCoverable) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}"
%>
package ${basePackage}

uses gw.lob.apd.APDFieldAccessor
uses gw.lob.apd.APDInstalledSplitFieldAccessor
uses gw.lob.apd.APDSplittableRiskBase

@Export
class ${coverable.QualifiedName}SplittableBase extends APDSplittableRiskBase {

  construct(owner : entity.${coverable.QualifiedName}) {
    _owner = owner
  }

  override property get SplittableFields() : APDFieldAccessor[] {
<%var fields = coverable.Fields.where(\elt -> elt.SplitByRatingPeriods).sort(TemplateComparators.AttributeOrdering)%>
    var splittableFields = {
<%for (f in fields index i) {%>
      new APDInstalledSplitFieldAccessor(entity.${coverable.QualifiedName}#${f.Name}.PropertyInfo)<%if (i+1 < fields.Count) {%>,<%}%>
<%}%>
    }
    return splittableFields.toTypedArray()
  }

}