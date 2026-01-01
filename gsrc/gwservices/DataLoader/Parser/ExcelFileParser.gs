package gwservices.DataLoader.Parser

uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses org.apache.poi.ss.usermodel. *

uses java.io.File

uses org.apache.poi.xssf.usermodel.XSSFWorkbook
uses org.slf4j.LoggerFactory

class ExcelFileParser {
  public static final var LOG: org.slf4j.Logger = LoggerFactory.getLogger("DataLoader.Parser")

  private var _workbook : XSSFWorkbook as Workbook
  private var _allSheetsExist : boolean as AllSheetsExist = true
  private var _sheetNamesInFile : List<String> as SheetNamesInFile

  construct() {
  }


  /**
   * Try to cast the file into a workbook.  If it fails it might be a binary file (Guidewire dosent like Binary files)
   * If it is another error then we will pick this up later
   * @param selectedWebFile
   * @return
   */
  public function canFileBeMadeIntoWorkbook(selectedWebFile: gw.api.web.WebFile): boolean {
    try {
      // Read in the file
      _workbook = new XSSFWorkbook(selectedWebFile.InputStream)
    } catch (e : RuntimeException) {
      return false
    }
    return true
  }

  /**
   * Try to cast the file into a workbook.  If it fails it might be a binary file (Guidewire dosent like Binary files)
   * If it is another error then we will pick this up later
   * @param selectedFile
   * @return
   */
  public function canFileBeMadeIntoWorkbook(selectedFile: File): boolean {
    try {
      // Read in the file
      _workbook = new XSSFWorkbook(selectedFile)
    } catch (e : RuntimeException) {
      return false
    }
    return true
  }

  /**
   * Try to cast the file into a workbook.  If it fails it might be a binary file (Guidewire dosent like Binary files)
   * If it is another error then we will pick this up later
   * @param selectedWebFile
   * @return
   */
  public function makeWorkbookFromFile(file: File): XSSFWorkbook {
    try {
      // Read in the file
      _workbook = new XSSFWorkbook(file)
    } catch (e : RuntimeException) {
      _workbook = null
      throw new DisplayableException(DisplayKey.get("Web.Rating.Errors.File.To.Workbook_ACC"))
    }
    return _workbook
  }


  public function getSheet(sheetName: String): Sheet {
    var result = _workbook.getSheet(sheetName)
    if (result == null) {
      LOG.warn(sheetName + "- sheet: Sheet not found")
    }
    return result
  }

  /**
   * List the the file to insure the internal data is as we expect
   */
  function checkWorkbookSheets(tabsList : List<String>) : boolean {
    _allSheetsExist = true
    _sheetNamesInFile = new ArrayList<String>()

    for (sheetName in tabsList) {
      if (getSheet(sheetName) == null) {
        _allSheetsExist = false
      } else {
        _sheetNamesInFile.add(sheetName)
      }
    }
    return _allSheetsExist
  }

  /**
   * List the the file to insure the internal data is as we expect
   */
  function listWorkbookSheets() : List<String> {
    var sheets : List<String> = new ArrayList<String>()

    var iter = _workbook.sheetIterator()
    while (iter.hasNext()) {
      var sheet = iter.next()
      sheets.add(sheet.getSheetName())
      print("Sheet name = " + sheet.getSheetName())
    }
    return sheets
  }

}
