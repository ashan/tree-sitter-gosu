package gw.apd.model

uses entity.APDCostDefinition

@Export
class CostCodeFilterHelper {

  var _filter : Boolean as FilterBy
  var _costCode : CostCode as readonly CostCode

  static function buildList(def: APDCostDefinition) : CostCodeFilterHelper[] {
    final var codeList = new ArrayList<CostCodeFilterHelper>()
    for (code in def.CostCodeFilterCandidates) {
      codeList.add(new CostCodeFilterHelper(code, def))
    }
    return codeList.toTypedArray()
  }

  static function applyUpdates(filters: CostCodeFilterHelper[], def: APDCostDefinition) {
    final var bundle = gw.transaction.Transaction.Current
    def = def.Bundle == null ? bundle.add(def) : def
    for (code in filters) {
      if (code.FilterBy and not def.CostCodeFilters.hasMatch(\ccf -> ccf.CostCode == code.CostCode)) {
        def.createAndAddFilter(code.CostCode)
      }
      if (not code.FilterBy and def.CostCodeFilters.hasMatch(\ccf -> ccf.CostCode == code.CostCode)) {
        def.removeFilter(def.CostCodeFilters.firstWhere(\ccf -> ccf.CostCode == code.CostCode))
      }
    }
  }

  construct(costCode: CostCode, def: APDCostDefinition) {
    _costCode = costCode
    _filter = def.CostCodeFilters.hasMatch(\ccf -> ccf.CostCode == costCode)
  }

  property get Code(): String {
    return _costCode.CostCode
  }

  property get Name(): String {
    return _costCode.CostName
  }

  property get Description(): String {
    return _costCode.Description
  }

}