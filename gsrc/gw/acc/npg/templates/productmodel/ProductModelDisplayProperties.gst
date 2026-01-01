<% uses gw.acc.npg.model.ProductLine %>
<%@ params(productLine: ProductLine) %>
PolicyLine_${productLine.LineCode}.Name = ${productLine.LineDisplayName} Line
PolicyLine_${productLine.LineCode}.Description = ${productLine.LineDisplayName} Line
Product_${productLine.ProductCode}.Name = ${productLine.LineDisplayName}
Product_${productLine.ProductCode}.Description = ${productLine.LineDisplayName}
PolicyLine_${productLine.LineCode}.CoverageCategory_${productLine.StndGroupName}.Name = ${productLine.LineCode} Standard Coverages
PolicyLine_${productLine.LineCode}.CoverageCategory_${productLine.AddGroupName}.Name = ${productLine.LineCode} Additional Coverages
<%if(productLine.IncludeExclusion){%>
PolicyLine_${productLine.LineCode}.CoverageCategory_${productLine.ExclusionGroupName}.Name = ${productLine.LineCode} Exclusions
<%}%>
<%if(productLine.IncludeCondition){%>
PolicyLine_${productLine.LineCode}.CoverageCategory_${productLine.ConditionGroupName}.Name = ${productLine.LineCode} Conditions
<%}%>
<%for(var coverable in productLine.Coverables){%>
PolicyLine_${productLine.LineCode}.CoverageCategory_${coverable.StndGroupName}.Name = ${coverable.EntityDisplayName } Standard Coverages
PolicyLine_${productLine.LineCode}.CoverageCategory_${coverable.AddGroupName}.Name = ${coverable.EntityDisplayName } Additional Coverages
<%if(coverable.IncludeExclusion){%>
PolicyLine_${productLine.LineCode}.CoverageCategory_${coverable.ExclusionGroupName}.Name = ${coverable.EntityDisplayName } Exclusions
<%}%>
<%if(coverable.IncludeCondition){%>
PolicyLine_${productLine.LineCode}.CoverageCategory_${coverable.ConditionGroupName}.Name = ${coverable.EntityDisplayName } Conditions
<%}%>
<%}%>