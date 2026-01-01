package edge.capabilities.currency.dto

uses gw.pl.currency.MonetaryAmount
uses gw.api.util.CurrencyUtil
uses gw.api.financials.CurrencyAmount
uses edge.capabilities.locale.util.LocaleHelper
uses java.math.RoundingMode
uses gw.api.util.LocaleUtil

enhancement AmountDTOEnhancement : edge.capabilities.currency.dto.AmountDTO {
  static function fromMonetaryAmount(amt:MonetaryAmount):AmountDTO {
    var res : AmountDTO = null;
    if ( amt != null ) {
      var scale = LocaleUtil.getCurrentLocale().getCurrencyFormat(amt.Currency.Code).FractionDigits
      res =new AmountDTO(){
        :Amount = amt.Amount.setScale(scale, CurrencyUtil.getRoundingMode()),
        :Currency = amt.Currency
      }
    }
    return res
  }
  static function fromCurrencyAmount(amt:CurrencyAmount):AmountDTO {
    return amt != null ? new AmountDTO(){:Amount=amt.Amount, :Currency=amt.Currency} : null
  }
  function toMonetaryAmount() : MonetaryAmount {
    // Because of single country implementation all the monetary amounts coming from the fronted
    // must be in the default system currency
    return new MonetaryAmount(this.Amount,CurrencyUtil.getDefaultCurrency())
  }
}
