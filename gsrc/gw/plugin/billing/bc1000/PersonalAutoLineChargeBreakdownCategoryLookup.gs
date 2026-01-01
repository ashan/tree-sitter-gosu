package gw.plugin.billing.bc1000

uses gw.billing.bc1000.DefaultChargeBreakdownCategoryLookup

@Export
class PersonalAutoLineChargeBreakdownCategoryLookup extends DefaultChargeBreakdownCategoryLookup {
  construct() {
    super({PALiabilityCov, PersonalVehicleCov, PersonalVehicle})
  }
}