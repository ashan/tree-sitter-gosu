package nz.co.acc.gwer.bulkupload.parser

uses edge.util.either.Either
uses gw.api.locale.DisplayKey
uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError
uses org.apache.poi.ss.usermodel.Cell
uses org.jetbrains.annotations.NonNls

class BoolXLSCellParser implements IXLSCellParser<Boolean> {

  @NonNls
  final static var FALSE_VALUES : Set<String> = {"false", "no", "n", "0"}
  final static var TRUE_VALUES : Set<String> = {"true", "yes", "y", "1"}

  override function parse(cell : Cell) : Either<FieldValidationError, Boolean> {
    if (FALSE_VALUES.contains(cell.toString().toLowerCase())) {
      return Either.right(Boolean.FALSE)

    } else if (TRUE_VALUES.contains(cell.toString().toLowerCase())) {
      return Either.right(Boolean.TRUE)

    } else {
      return Either.left(new FieldValidationError(DisplayKey.get("Web.Experiencerating.BulkUpload.XLS.InvalidBoolValErrMsg", cell.toString(), columnLetter(cell.ColumnIndex))))
    }

  }
}