package nz.co.acc.gwer.bulkupload.parser

uses edge.util.either.Either
uses gw.api.locale.DisplayKey
uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError
uses nz.co.acc.common.integration.files.inbound.utils.InboundUtility
uses org.apache.poi.ss.usermodel.Cell
uses org.apache.poi.ss.usermodel.CellType

class PolicyIDXLSCellParser implements IXLSCellParser<String> {

  override function parse(cell : Cell) : Either<FieldValidationError, String> {
    if (cell.CellType != CellType.STRING) {
      return Either.left(new FieldValidationError(DisplayKey.get("Web.Experiencerating.BulkUpload.XLS.InvalidStrValErrMsg", cell.CellType, cell.toString(), columnLetter(cell.ColumnIndex))))
    }
    if (not InboundUtility.isValidPolicyNumberFormat(cell.StringCellValue)) {
      return Either.left(new FieldValidationError(DisplayKey.get("Web.Experiencerating.BulkUpload.XLS.InvalidPolicyIDStrValErrMsg", cell.StringCellValue, columnLetter(cell.ColumnIndex))))
    }
    return Either.right(cell.StringCellValue)
  }

}