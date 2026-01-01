package nz.co.acc.common.excelexporter

uses gw.api.web.document.DocumentsHelper
uses gw.document.DocumentContentsInfo
uses org.apache.poi.ss.usermodel.IndexedColors
uses org.apache.poi.xssf.usermodel.XSSFCell
uses org.apache.poi.xssf.usermodel.XSSFCellStyle
uses org.apache.poi.xssf.usermodel.XSSFRow
uses org.apache.poi.xssf.usermodel.XSSFSheet
uses org.apache.poi.xssf.usermodel.XSSFWorkbook

uses java.io.File
uses java.io.FileInputStream
uses java.io.FileOutputStream

/**
 * Created by Franklin Manubag on 3/6/2020.
 */
abstract class ExcelExporter {
  var _workbook : XSSFWorkbook
  var _headerCellStyle : XSSFCellStyle
  var EXCEL_MIME_TYPE : String = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

  construct() {
    _workbook = new XSSFWorkbook()
    createHeaderStyle()
  }

  public function addWorksheet(sheetName : String) : XSSFSheet {
    return _workbook.createSheet(sheetName)
  }

  public function export(filename : String) {
    writeDataToWorkSheet()
    var outputStream = new FileOutputStream(filename);
    _workbook.write(outputStream)
    outputStream.close()
    _workbook.close()

    var dci = new DocumentContentsInfo(DocumentContentsInfo.ContentResponseType.DOCUMENT_CONTENTS,
        new FileInputStream(filename), EXCEL_MIME_TYPE)
    DocumentsHelper.renderDocumentContentsWithDownloadDisposition(filename, dci)
    new File(filename).delete()
  }

  public function createHeaderStyle() {
    var headerFont = _workbook.createFont()
    headerFont.setBold(true)
    headerFont.setFontHeightInPoints(12)
    headerFont.setColor(IndexedColors.BLACK1.getIndex())

    // Create a CellStyle with the font
    _headerCellStyle = _workbook.createCellStyle();
    _headerCellStyle.setFont(headerFont);
  }

  public function createHeaderCellDefaultStyle(dhdRow : XSSFRow, cellIndex : int, value : String) : XSSFCell {
    var cell = dhdRow.createCell(cellIndex)
    cell.setCellStyle(_headerCellStyle)
    cell.setCellValue(value)
    return cell
  }

  public function createHeaderCellDefaultStyle(dhdRow : XSSFRow, style: XSSFCellStyle, cellIndex : int, value : String) : XSSFCell {
    var cell = dhdRow.createCell(cellIndex)
    cell.setCellStyle(style)
    cell.setCellValue(value)
    return cell
  }

  property get WorkBook() : XSSFWorkbook {
    return _workbook
  }

  abstract function writeDataToWorkSheet()
}