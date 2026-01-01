<% uses gw.acc.npg.model.BaseCost %>
<%@ params(baseCost:BaseCost) %>
package ${baseCost.LOBPackageName}.financials

/**
 * Additional methods and properties provided by the costs that supply this interface.
 */
@Export
interface ${baseCost.CostMethodsInterfaceName} {

  property get Coverage(): Coverage

  property get OwningCoverable(): Coverable

  property get Jurisdiction(): Jurisdiction
}