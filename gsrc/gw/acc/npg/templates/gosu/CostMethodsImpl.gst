<% uses gw.acc.npg.model.BaseCost %>
<% uses gw.acc.npg.model.ProductLine %>
<%@ params(baseCost:BaseCost, productLine:ProductLine) %>
package ${baseCost.LOBPackageName}.financials

<%if(baseCost typeis gw.acc.npg.model.Cost){%>
uses gw.api.util.JurisdictionMappingUtil

<%}%>
@Export
class ${baseCost.CostMethodsImplName} extends ${baseCost.GenericCostMethodsImplName}<${baseCost.EntityName}> {

  construct(owner: entity.${baseCost.EntityName}) {
    super(owner)
  }
<%if(baseCost typeis gw.acc.npg.model.Cost){%>

  override property get Coverage(): Coverage {
<%if(baseCost.Coverage!=null){%>
    return _owner.${baseCost.CoverageFkField.Name}
<%} else if(baseCost.InheritsLineCoverage){%>
    return _owner.${baseCost.InheritedLineCoverageFk.Name}
<%} else {%>
    return null
<%}%>
  }
<%if(baseCost.Coverable!=null){%>

  override property get OwningCoverable(): ${baseCost.Coverable.EntityName} {
    return _owner.${baseCost.CoverableFkField.Name}
  }
<%} else if(baseCost.Coverage!=null){%>

  override property get OwningCoverable(): ${baseCost.Coverage.Coverable.EntityName} {
    return _owner.${baseCost.CoverageFkField.Name}.${baseCost.Coverage.FkFieldToCoverable.Name}
  }
<%} else {%>

  override property get OwningCoverable(): ${baseCost.LineEntityName} {
    return _owner.${baseCost.LineFKField.Name}
  }
<%}%>
<%}%>
<%if(baseCost typeis gw.acc.npg.model.Cost){%>
<%if(baseCost.Coverable!=null){// base the jurisdiction on the Coverable if possible%>
<%var pathToJurisdiction = "${baseCost.CoverableFkField.Name}.${baseCost.Coverable.PathToJurisdiction}"%>
${JurisdictionFunctionImpl.renderToString(baseCost.Coverable,"Jurisdiction",pathToJurisdiction)}
<%} else if(baseCost.Coverage!=null){// coverage is second choice%>
<%var pathToJurisdiction = "${baseCost.CoverageFkField.Name}.${baseCost.Coverage.PathToJurisdiction}"%>
${JurisdictionFunctionImpl.renderToString(baseCost.Coverage.Coverable,"Jurisdiction",pathToJurisdiction)}
<%} else if(baseCost.InheritsLineCoverage){// This can occur when the Cost is linked to a line-level coverage%>

  override property get Jurisdiction(): Jurisdiction {
    return _owner.${baseCost.InheritedLineCoverageFk.Name}.${baseCost.InheritedLineCoverage.FkFieldToCoverable.Name}.Branch.BaseState
  }
<%} else if(baseCost.InheritsLineCoverable){// This can occur if the Cost is linked only to the PolicyLine (as a coverable)%>

  override property get Jurisdiction(): Jurisdiction {
    return _owner.${baseCost.InheritedLineCoverableFk.Name}.Branch.BaseState
  }
<%} else {// default to calling super class%>

  override property get Jurisdiction(): Jurisdiction {
    return super.Jurisdiction
  }
<%}%>
<%} else {%>

  override property get Jurisdiction(): Jurisdiction {
    return _owner.${baseCost.LineFKField.Name}.Branch.BaseState
  }
<%}%>

}