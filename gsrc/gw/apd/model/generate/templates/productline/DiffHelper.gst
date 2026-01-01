<%
uses gw.apd.model.generate.templates.TemplateComparators
%>
<%@ params(productLine : APDProductLine) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${productLine.LinePrefixLowerCase}"
%>
package ${basePackage}

uses gw.api.diff.DiffItem
uses gw.plugin.diff.impl.DiffHelper

@Export
class ${productLine.LinePrefix}DiffHelperBase extends DiffHelper<entity.${productLine.QualifiedName}> {

  construct(reason : DiffReason, line1 : entity.${productLine.QualifiedName}, line2 : entity.${productLine.QualifiedName}) {
    super(reason, line1, line2)
  }

  /**
   * Should be used to add diff items that apply to this LOB, e.g. line-level coverages
   *
   * @param diffItems - list of diff items to add to
   * @return List<DiffItem> - returns the list of diff items that we've modified
   */
  override function addDiffItems(diffItems : List<DiffItem>) : List<DiffItem> {
    diffItems = super.addDiffItems(diffItems)

<%for (f in productLine.Fields.sort(TemplateComparators.AttributeOrdering)) {%>
    diffItems.addAll(this.compareLineField("${f.Name}",1))
<%}%>
<%if (productLine.Coverages.Count > 0) {%>
    diffItems.addAll(this.compareLineField("${productLine.LinePrefix}Coverages",3))
<%}%>
<%if (productLine.Conditions.Count > 0) {%>
    diffItems.addAll(this.compareLineField("${productLine.LinePrefix}Conditions",3))
<%}%>
<%if (productLine.Exclusions.Count > 0) {%>
    diffItems.addAll(this.compareLineField("${productLine.LinePrefix}Exclusions",3))
<%}%>
<%if (productLine.HasModifiers) {%>
    diffItems.addAll(this.compareLineField("${productLine.LinePrefix}Modifiers",2))
<%}%>
<%for (e in productLine.Exposures.where(\elt -> elt.RatingType == APDExposureRatingType.TC_TERM).sort(TemplateComparators.ExposureOrdering)) {%>
    diffItems.addAll(this.compareLineField("${e.TypeName}s",2))
<%}%>
<%for(var cbl in productLine.ChildCoverables.sort(TemplateComparators.CoverableOrdering)){%>
    diffItems.addAll(this.compareLineField("${cbl.TypeName}s", ${cbl.DiffDepth}))
<%}%>

    return diffItems
  }

  /**
   * Filters diff items that apply to this LOB
   *
   * @param diffItems - list of diff items to filter
   * @return List<DiffItem> - returns the list of diff items that we've modified
   */
  override function filterDiffItems(diffItems : List<DiffItem>) : List<DiffItem> {
<%for (e in productLine.AllExposures.where(\elt -> elt.RatingType != APDExposureRatingType.TC_TERM).sort(TemplateComparators.ExposureOrdering)) {%>
    // Remove and re-diff ${e.Name} exposures to include the effective dated split of the basis
    diffItems.removeWhere(\ d -> d.Bean typeis ${productLine.LinePrefix}${e.TypeName})
    diffItems = add${e.TypeName}Diffs(diffItems)
<%}%>

    diffItems = super.filterDiffItems(diffItems)
    return diffItems
  }

<%for (e in productLine.AllExposures.where(\elt -> elt.RatingType != APDExposureRatingType.TC_TERM).sort(TemplateComparators.ExposureOrdering)) {%>
  private function add${e.TypeName}Diffs(diffItems : List<DiffItem>) : List<DiffItem> {
    return addSplittableDiffs(diffItems, \ d -> d.All${productLine.LinePrefix}${e.TypeName}sWM, \ s -> get${e.TypeName}Key(s))
  }

  private function get${e.TypeName}Key(${e.TypeName} : ${productLine.LinePrefix}${e.TypeName}) : String {
<%var keys = e.Fields.where(\f -> f.BasisScalingKey).sort(TemplateComparators.AttributeOrdering).map(\elt -> "${e.TypeName}.${elt.Name}.toString()")%>
    return ${String.join(" + \" \" + ", keys)}
  }

<%}%>
}