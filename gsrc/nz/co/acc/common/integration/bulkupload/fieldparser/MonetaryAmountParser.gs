package nz.co.acc.common.integration.bulkupload.fieldparser

uses edge.util.either.Either
uses gw.pl.currency.MonetaryAmount
uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError

uses java.math.RoundingMode

/**
 * Created by Mike Ourednik on 23/01/2019.
 */
class MonetaryAmountParser implements IFieldParser<MonetaryAmount> {

  override function parse(text : String) : Either<FieldValidationError, MonetaryAmount> {
    try {
      var monetaryAmount = text.toBigDecimal().setScale(2, RoundingMode.HALF_EVEN).toMonetaryAmount()
      return Either.right(monetaryAmount)
    } catch (e : Exception) {
      return Either.left(new FieldValidationError("'${text}' is not a number"))
    }
  }
}