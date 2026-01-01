package gw.job.uw.comparators

uses gw.api.locale.DisplayKey
uses gw.pl.currency.MonetaryAmount

uses java.math.BigDecimal

/**
 * A "Absolute" comparator wrapper with BigDecimal values, and where to be "in bounds", values must be smaller
 * than or equal to the reference value.
 * Absolute will convert any negative numbers to positive before the comparison.
 */
@Export
class AbsoluteNumericLEValueComparatorWrapper extends NumericLEValueComparatorWrapper {

  construct(comparatorArg : ValueComparator) {
    super(comparatorArg)
  }

  override protected function doOffset(a : BigDecimal, b : BigDecimal) : BigDecimal {
    return a + b
  }

  override function compare(value : String, referenceValue : String) : boolean {
    // Is the valuer a number or a MonetaryAmount.
    if (value.contains(" ") or value.contains("nzd")) {
      var absoluteMonetaryLEValueComparatorWrapper = new AbsoluteMonetaryLEValueComparatorWrapper(this.ComparisonType)
      return absoluteMonetaryLEValueComparatorWrapper.compare(value, referenceValue)
    }

    return ValueType.deserialize( new BigDecimal(value).abs().toPlainString()) <= ValueType.deserialize(referenceValue)
  }

  override function formatAsCondition(formattedValue : String) : String {
    return DisplayKey.get("UWIssue.ValueFormat.AtMost", formattedValue)
  }
}
