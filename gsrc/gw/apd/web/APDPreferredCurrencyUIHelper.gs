package gw.apd.web

@Export
class APDPreferredCurrencyUIHelper {

  static function canEditCurrencies(policyPeriod : PolicyPeriod) : Boolean {
    return gw.api.util.CurrencyUtil.isMultiCurrencyMode() and
        (policyPeriod.Policy.APDProduct.Currencies == null or policyPeriod.Policy.APDProduct.Currencies != APDCurrencyHandling.TC_DOMESTIC)
  }

  static function hasSeparateSettlementCurrency(policyPeriod : PolicyPeriod) : Boolean {
    return policyPeriod.Policy.APDProduct.Currencies == null or policyPeriod.Policy.APDProduct.Currencies != APDCurrencyHandling.TC_SINGLE
  }

}