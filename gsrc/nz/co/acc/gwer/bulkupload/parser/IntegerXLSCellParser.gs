package nz.co.acc.gwer.bulkupload.parser

uses edge.util.either.Either
uses gw.api.locale.DisplayKey
uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError
uses org.apache.poi.ss.usermodel.Cell

class IntegerXLSCellParser implements IXLSCellParser<Integer> {

  override function parse(cell : Cell) : Either<FieldValidationError, Integer> {
    var errOrVal = new NumericXLSCellParser().parse(cell)
    if (errOrVal.isLeft) {
      return Either.left(errOrVal.left)
    }
    var doubleVal = errOrVal.right
    if (doubleVal >= Integer.MIN_VALUE and doubleVal <= Integer.MAX_VALUE) {
      return Either.right(doubleVal as Integer)
    } else {
      return Either.left(new FieldValidationError(DisplayKey.get("Web.Experiencerating.BulkUpload.XLS.InvalidIntegerValErrMsg", doubleVal as String, columnLetter(cell.ColumnIndex))))
    }
  }
}