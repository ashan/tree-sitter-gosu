<% uses gw.acc.npg.model.BaseCost %>
<%@ params(baseCost:BaseCost) %>
package ${baseCost.LOBPackageName}.financials

@Export
class ${baseCost.GenericCostMethodsImplName}<T extends ${baseCost.EntityName}> implements ${baseCost.CostMethodsInterfaceName} {

  protected var _owner: T as readonly Cost

  construct( owner: T ) {
    _owner = owner
  }

  override property get Coverage(): Coverage {
    return null
  }

  override property get OwningCoverable(): Coverable {
    return null
  }

  override property get Jurisdiction(): Jurisdiction {
    return null
  }

}