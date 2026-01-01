<% uses gw.acc.npg.model.Cost %>
<% uses gw.acc.npg.model.ColumnType %>
<%@ params(cost:Cost) %>
package ${cost.LOBPackageName}.rating

uses gw.financials.PolicyPeriodFXRateCache
uses gw.api.effdate.EffDatedUtil
uses gw.pl.persistence.core.effdate.EffDatedVersionList
<%if (cost.Coverable != null){%>
uses entity.windowed.${cost.Coverable.VersionListName}
<%}%>
<%if (cost.Coverage != null){%>
uses entity.windowed.${cost.Coverage.VersionListName}
<%}%>
uses entity.windowed.${cost.VersionListName}

uses java.util.Date

uses gw.pl.persistence.core.Key

class ${cost.CostDataImplName} extends ${cost.BaseCostDataImplName}<${cost.EntityName}> {

<%for(var field in cost.AdditionalFields.where(\f -> f.Type != ColumnType.Array)){%>
  var ${field.Name}: ${field.GosuDataType}
<%}%>
<%if (cost.Coverable!=null and cost.Coverage!=null){%>
${CostDataImplWithCoverableAndCoverage.renderToString(cost)}
<%} else if (cost.Coverable!=null){%>
${CostDataImplWithCoverable.renderToString(cost)}
<%} else if(cost.Coverage!=null){%>
${CostDataImplWithCoverage.renderToString(cost)}
<%} else {%>
${CostDataImplWithoutCoverableAndCoverage.renderToString(cost)}
<%}%>
}