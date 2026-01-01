package edge.util.helper

uses gw.pl.currency.MonetaryAmount
uses java.lang.Iterable
uses gw.api.util.CurrencyUtil
uses java.util.Arrays
uses java.math.BigDecimal

class CurrencyOpUtil {

  static function sumArray<T extends Cost>(costs:T[]) : MonetaryAmount {
    if ( costs == null || costs.IsEmpty) {
      return null
    }
    return sum(Arrays.asList(costs))
  }

  static function sum(costs:Iterable<Cost>) : MonetaryAmount {
    if ( costs == null ) {
      return null
    }
    return costs.AmountSum(CurrencyUtil.getDefaultCurrency())
  }

  static function toAmount(number:BigDecimal
  ) : MonetaryAmount {
    return new MonetaryAmount(number, CurrencyUtil.getDefaultCurrency())
  }
}
