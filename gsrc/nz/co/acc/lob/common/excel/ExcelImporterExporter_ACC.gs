package nz.co.acc.lob.common.excel

uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.api.validation.EntityValidationException
uses gw.api.web.document.DocumentsHelper
uses gw.document.DocumentContentsInfo
uses gw.pl.util.FileUtil
uses gw.validation.PCValidationResult
uses org.apache.poi.ss.usermodel.Workbook
uses org.apache.poi.xssf.usermodel.XSSFWorkbook

uses java.io.FileInputStream
uses java.io.FileOutputStream
uses java.text.SimpleDateFormat

/**
 * Import and Export entities.
 */
class ExcelImporterExporter_ACC<T> {
  public static final var EXCEL_MIME_TYPE : String = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  private var _excelEntityConverter : ExcelEntityConverter_ACC as ExcelEntityConverter
  private var _validateRows : boolean

  construct(excelEntityConverter : ExcelEntityConverter_ACC) {
    this._excelEntityConverter = excelEntityConverter
    this._validateRows = true // validate by default
  }

  construct(excelEntityConverter : ExcelEntityConverter_ACC, validateRows : boolean) {
    this._excelEntityConverter = excelEntityConverter
    this._validateRows = validateRows
  }

  public function exportToSpreadsheet(data : List<T>) {
    var workbook = new XSSFWorkbook()
    var sheet = workbook.createSheet(_excelEntityConverter.getSheetName())
    // add the header row
    var headerRow = sheet.createRow(0)
    var headings = _excelEntityConverter.getHeadings()
    for (heading in headings index i) {
      var cell = headerRow.createCell(i)
      var font = workbook.createFont()
      font.setBold(true)
      var cellStyle = workbook.createCellStyle()
      cellStyle.setFont(font)
      cell.setCellValue(heading)
      cell.setCellStyle(cellStyle)
    }
    for (entity in data index rowNumber) {
      _excelEntityConverter.addEntityToSheet(entity, workbook, sheet, rowNumber + 1)
    }
    // save the spreadsheet
    saveExcelFile(workbook)
  }

  public function importFromSpreadsheet(workbook : XSSFWorkbook) {
    // Validate sheet name
    var sheet = workbook.getSheet(_excelEntityConverter.getSheetName())
    if (sheet == null) { // sheet not found
      throw new DisplayableException(DisplayKey.get("Web.Admin_ACC.BusinessIndustryCode_ClassificationUnit_Data.ExcelSheetNotFound", _excelEntityConverter.getSheetName()))
    }
    // Validate the data
    if (_validateRows) {
      for (row in sheet.rowIterator() index rowNumber) {
        // ignore the titles
        if (rowNumber > 0) {
          _excelEntityConverter.validateRow(row, rowNumber + 1)
        }
      }
    }
    // display the errors
    if (_excelEntityConverter.getPCValidationResult().hasErrors()) {
      throw new EntityValidationException(_excelEntityConverter.getPCValidationResult(), ValidationLevel.TC_DEFAULT)
    }
    // only do the database operations if there were no validation errors
    if (!_excelEntityConverter.getPCValidationResult().hasErrors()) {
      for (row in sheet.rowIterator() index rowNumber) {
        // ignore the titles
        if (rowNumber > 0) {
          _excelEntityConverter.updateOrInsertEntity(row, rowNumber + 1)
        }
      }
    }
  }

  function saveExcelFile(workbook: Workbook): void {
    var timestamp = new SimpleDateFormat("yyyy-MM-dd-HH.mm.ss").format(Date.Now)
    var excelFileName = "${_excelEntityConverter.getFileName()}-${timestamp}.xlsx"
    var tmpWksFile = FileUtil.createDeletableTempFile("wks", null)
    try {
      using(var os = new FileOutputStream(tmpWksFile)) {
        workbook.write(os)
      }
      var dci = new DocumentContentsInfo(DocumentContentsInfo.ContentResponseType.DOCUMENT_CONTENTS,
          new FileInputStream(tmpWksFile), EXCEL_MIME_TYPE)
      DocumentsHelper.renderDocumentContentsWithDownloadDisposition(excelFileName, dci)
    } finally {
      tmpWksFile.delete()
    }
  }
}