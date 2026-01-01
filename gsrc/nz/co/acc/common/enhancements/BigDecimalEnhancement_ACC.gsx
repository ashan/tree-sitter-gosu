package nz.co.acc.common.enhancements

uses gw.api.financials.CurrencyAmount
uses gw.pl.currency.MonetaryAmount

uses java.math.BigDecimal

/**
 * Created by Mike Ourednik on 29/08/2019.
 */
enhancement BigDecimalEnhancement_ACC : BigDecimal {

  function toMonetaryAmount(): MonetaryAmount {
    return new MonetaryAmount(this, Currency.TC_NZD)
  }

  function toCurrencyAmount(): CurrencyAmount {
    return toMonetaryAmount().toCurrencyAmount()
  }
}
