<% uses gw.acc.npg.model.Coverable %>
<%@ params(coverable:Coverable) %>
package ${coverable.LOBPackageName}

uses gw.coverage.CoverageAdapterBase
uses gw.api.reinsurance.ReinsurableCoverable
uses gw.api.util.JurisdictionMappingUtil

@Export
class ${coverable.Coverage.CoverageAdapterImplName} extends CoverageAdapterBase {

  var _owner: entity.${coverable.Coverage.EntityName}

  construct(owner: entity.${coverable.Coverage.EntityName}) {
    super(owner)
    _owner = owner
  }
${JurisdictionFunctionImpl.renderToString(coverable, "CoverageState",coverable.Coverage.PathToJurisdiction)}

  override property get PolicyLine(): PolicyLine {
    return (_owner.${coverable.Coverage.PathToLine})
  }

  override property get OwningCoverable(): Coverable {
    return (_owner.${coverable.Coverage.FkFieldToCoverable.Name})
  }

  override function addToCoverageArray(p0: Coverage): void {
    _owner.${coverable.Coverage.FkFieldToCoverable.Name}.addTo${coverable.CoverageArrayColumnName}(p0 as ${coverable.Coverage.EntityName})
  }

  override function removeFromParent(): void {
    _owner.${coverable.Coverage.FkFieldToCoverable.Name}.removeFrom${coverable.CoverageArrayColumnName}(_owner)
  }

  override property get ReinsurableCoverable(): ReinsurableCoverable {<%
if (coverable.ReinsurableIsWholePolicy) {%>
    return _owner.BranchValue
<%} else {%>
    return _owner.${coverable.Coverage.FkFieldToCoverable.Name}.${coverable.PathToReinsurable}
<%}%>
  }
}
