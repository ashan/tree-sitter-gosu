package nz.co.acc.rating.validation

uses gw.rating.rtm.domain.ErrorCollectingVisitor
uses gw.rating.rtm.domain.ErrorCollector
uses gw.rating.rtm.domain.table.RateBookModel
uses gw.rating.rtm.domain.table.RateTableCell
uses gw.rating.rtm.domain.table.RateTableRow

/**
 * Validate that the parameters are not null.
 */
class NullParameterValueVisitor_ACC extends ErrorCollectingVisitor {

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
    return false
  }

  override function visit(ratingRow: RateTableRow) {
    for (cell in ratingRow.Parameters) {
      if (cell.Value == null) {
        addCellError(ratingRow, cell, RateTableErrorType.TC_INVALIDVALUE)
      }
    }
  }

  override function visit(bookModel: RateBookModel) {

  }
}