package nz.co.acc.rating.validation

uses gw.rating.rtm.domain.ErrorCollectingVisitor
uses gw.rating.rtm.domain.ErrorCollector
uses gw.rating.rtm.domain.table.RateBookModel
uses gw.rating.rtm.domain.table.RateTableCell
uses gw.rating.rtm.domain.table.RateTableModel
uses gw.rating.rtm.domain.table.RateTableRow
uses gw.validation.PCValidationResult
uses nz.co.acc.rating.util.RatingUtil_ACC
uses entity.ClassificationUnit_ACC

/**
 * The super class for the ACC validation rules.
 */
class ValidationRule_ACC extends ErrorCollectingVisitor {
  protected final var CLASSIFICATION_UNIT_CODE_KEY : String = "ClassificationUnitCode"
  protected final var START_DATE_KEY : String = "StartDate"
  protected final var END_DATE_KEY : String = "EndDate"
  protected var _result : PCValidationResult
  protected var _model : RateTableModel

  construct(collector : ErrorCollector) {
    super(collector)
  }

  protected function findClassificationUnit(classificationUnitCode : String, startDate : Date, endDate : Date) : ClassificationUnit_ACC {
    return RatingUtil_ACC.findClassificationUnit(classificationUnitCode, startDate, endDate)
  }

  protected function findAllClassificationUnits() : List<ClassificationUnit_ACC> {
    return RatingUtil_ACC.findAllClassificationUnits()
  }

  protected function findClassificationUnitsForLevyYear(startDate : Date, endDate : Date) : List<ClassificationUnit_ACC> {
    return RatingUtil_ACC.findClassificationUnitsForLevyYear(startDate, endDate)
  }

  protected function findAllClassificationUnitsBeforeLevyEndDate(levyEndDate : Date) : List<ClassificationUnit_ACC> {
    return RatingUtil_ACC.findAllClassificationUnitsBeforeLevyEndDate(levyEndDate)
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
  }

  override function visit(bookModel: RateBookModel) {
  }
}