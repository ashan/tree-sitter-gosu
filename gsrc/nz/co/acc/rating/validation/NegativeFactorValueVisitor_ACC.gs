package nz.co.acc.rating.validation

uses gw.rating.rtm.domain.ErrorCollectingVisitor
uses gw.rating.rtm.domain.ErrorCollector
uses gw.rating.rtm.domain.table.RateBookModel
uses gw.rating.rtm.domain.table.RateTableCell
uses gw.rating.rtm.domain.table.RateTableRow

uses java.math.BigDecimal

/**
 * Created by ian on 30/03/2017.
 */
class NegativeFactorValueVisitor_ACC extends ErrorCollectingVisitor {

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
      } else if (cell.Value.compareTo(BigDecimal.ZERO) < 0) {
        addCellError(ratingRow, cell, RateTableErrorType.TC_NEGATIVEFACTORVALUE_ACC)
      }
    }
  }

  override function visit(bookModel: RateBookModel) {

  }
}