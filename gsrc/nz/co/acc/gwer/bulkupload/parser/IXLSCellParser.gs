package nz.co.acc.gwer.bulkupload.parser

uses edge.util.either.Either
uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError
uses org.apache.poi.ss.usermodel.Cell

interface IXLSCellParser<FieldType> {
  function parse(cell: Cell): Either<FieldValidationError, FieldType>
  function columnLetter(columnIndex: Integer): String {
    if (columnIndex < 0) return columnIndex.toString()
    var columnLetter = new StringBuilder()
    while (columnIndex >=0) {
      var reminder = columnIndex % 26
      columnLetter.insert(0, (char) ('A' + reminder))
      columnIndex = columnIndex / 26 - 1
    }
    return columnLetter.toString()

  }
}