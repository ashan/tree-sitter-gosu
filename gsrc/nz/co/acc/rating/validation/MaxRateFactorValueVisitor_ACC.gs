package nz.co.acc.rating.validation

uses gw.rating.rtm.domain.ErrorCollectingVisitor
uses gw.rating.rtm.domain.ErrorCollector
uses gw.rating.rtm.domain.table.RateBookModel
uses gw.rating.rtm.domain.table.RateTableCell
uses gw.rating.rtm.domain.table.RateTableRow

uses java.math.BigDecimal

/**
 * To ensure that rate factor values we enter are below the maximum allowed value
 * Created by farooq on 31/07/2017
 */
class MaxRateFactorValueVisitor_ACC extends ErrorCollectingVisitor {
  // Maximum allowed value that we can have a for a rate factor
  public final var MAX_RATE_ALLOWED: BigDecimal = 100bd
  // assumption - rate factor columns that we need to validate will always contain this word
  public final var RATE_FACTOR_CELL_KEYWORD: String = "rate"

  construct(collector: ErrorCollector) {
    super(collector)
  }

  override function visitBoolean(ratingCell: RateTableCell<Comparable<Object>>) {

  }

  override function visitDate(ratingCell: RateTableCell<Comparable<Object>>) {

  }

  override function visitDecimal(ratingCell: RateTableCell<Comparable<Object>>) {

  }

  override function visitInteger(ratingCell: RateTableCell<Comparable<Object>>) {

  }

  override function visitString(ratingCell: RateTableCell<Comparable<Object>>) {

  }

  override function visitEmpty(ratingCell: RateTableCell<Comparable<Object>>) {

  }

  override function visitingEmptyCells(): boolean {
    return true
  }

  override function visit(ratingRow: RateTableRow) {
    for (cell in ratingRow.Factors) {
      if (cell.Value == null) {
        addCellError(ratingRow, cell, RateTableErrorType.TC_INVALIDVALUE)
      } else if (cell.ColumnName.containsIgnoreCase(RATE_FACTOR_CELL_KEYWORD) and
          cell.Value > MAX_RATE_ALLOWED) {
        // Add an error
        // IF we have a rate factor column that contains RATE_FACTOR_CELL_KEYWORD anywhere in its name
        // AND the rate factor value >  MAX_RATE_ALLOWED
        addCellError(ratingRow, cell, RateTableErrorType.TC_EXCEEDSMAXVALUE_ACC)
      }
    }
  }

  override function visit(bookModel: RateBookModel) {

  }
}