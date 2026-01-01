package gw.apd.model

uses gw.apd.model.generate.CostCodeSystemTableGenerator
uses gw.api.database.Query

@Export
class CostCodeHelper {

  var _costCodes : List<CostCode> as readonly CostCodes

  construct() {
    final var bundle = gw.transaction.Transaction.getCurrent()
    _costCodes = new ArrayList<CostCode>()
    for (cc in Query.make(CostCode).select().iterator()) {
      _costCodes.add(bundle.add(cc))
    }
  }

  function addToCostCodes(costCode : CostCode) {
    _costCodes.add(costCode)
  }

  function removeFromCostCodes(costCode : CostCode) {
    costCode.remove()
    _costCodes.remove(costCode)
  }

  /**
   * Recreates the CostCode XML in the systables directory to match the entries persisted
   */
  function saveSystemTableXML() {
    new CostCodeSystemTableGenerator().generateConfig(_costCodes)
  }

}