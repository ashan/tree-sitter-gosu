package nz.co.acc.edge.time.annotation

uses edge.aspects.validation.Validation
uses edge.aspects.validation.annotations.Range
uses edge.el.Expr
uses edge.metadata.annotation.IMetaMultiFactory
uses nz.co.acc.edge.time.LocalDateDTO_ACC
uses nz.co.acc.edge.time.LocalDateUtil_ACC

/**
 * Validator for the day of the month.
 */
class DayOfMonth_ACC implements IMetaMultiFactory {

  private static final var RULES =
      new Range(1, Expr.call(LocalDateUtil_ACC#daysInLocalDate(LocalDateDTO_ACC), {Validation.PARENT})).getState()

  override function getState(): Object[] {
    return RULES
  }
}
