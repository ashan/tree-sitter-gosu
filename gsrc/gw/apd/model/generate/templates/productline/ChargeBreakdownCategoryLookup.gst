<%
uses gw.apd.model.generate.templates.TemplateComparators
%>
<%@ params(productLine : APDProductLine) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${productLine.LinePrefixLowerCase}"
%>
package ${basePackage}

uses gw.apd.chargebreakdown.InstalledLineChargeBreakdown
uses gw.billing.ChargeBreakdownCriterion
uses gw.billing.ChargeBreakdownCriterionFactory

class ${productLine.CodeIdentifier}ChargeBreakdownCategoryLookupBase extends InstalledLineChargeBreakdown {

  construct() {
    super(entity.${productLine.LinePrefix}CostDefinition)
  }

  override property get Criteria() : Set<ChargeBreakdownCriterion> {
    return {
<%for(var coverable in productLine.AllChildCoverables.concat({productLine}).sort(TemplateComparators.CoverableOrdering)) {%>
      ChargeBreakdownCriterionFactory.getCriterion(${coverable.QualifiedName}),
      ChargeBreakdownCriterionFactory.getCriterion(${coverable.QualifiedName}Cost),
<%if (coverable.Coverages.HasElements) {%>
<% /* these entities are only generated if the coverable has coverages */ %>
      ChargeBreakdownCriterionFactory.getCriterion(${coverable.QualifiedName}Cov),
      ChargeBreakdownCriterionFactory.getCriterion(${coverable.QualifiedName}CovCost),
<% } /* if has coverages */ %>
<% } /* for each coverable */ %>
      ChargeBreakdownCriterionFactory.getCriterion(RateAmountType)
    }
  }

}