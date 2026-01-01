package gw.plugin.billing.bc1000

uses gw.billing.bc1000.DefaultChargeBreakdownCategoryLookup

@Export
class CPLineChargeBreakdownCategoryLookup extends DefaultChargeBreakdownCategoryLookup {
  construct() {
    super({CPLine})
  }
}