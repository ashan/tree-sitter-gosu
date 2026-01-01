package nz.co.acc.rating.import

uses com.guidewire.modules.key.SingleFileKey
uses com.guidewire.pl.system.dependency.PLDependencies
uses com.guidewire.pl.web.internaltools.smoketest.SmokeTestSessionMock
uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.pcf.rating.ratebook.RateBookXMLImportUIHelper
uses gw.rating.rtm.domain.migration.RateBookImporter
uses gw.rating.rtm.util.WebFileWrapper
uses nz.co.acc.lob.common.excel.BusinessIndustryCodeExcelEntityConverter_ACC
uses nz.co.acc.lob.common.excel.ClassificationUnitExcelEntityConverter_ACC
uses nz.co.acc.lob.common.excel.ExcelImporterExporter_ACC

uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.sampledata.MockHttpServletRequest_ACC
uses nz.co.acc.common.sampledata.SampleDataWebFile_ACC
uses org.apache.poi.openxml4j.util.ZipSecureFile
uses org.apache.poi.xssf.usermodel.XSSFWorkbook
uses org.easymock.EasyMock

uses javax.servlet.http.HttpServletResponse
uses java.io.FileInputStream
uses java.lang.invoke.MethodHandles

/**
 * Load the Test or Production Ratebook data including BIC and CU data
 * <p>
 * 1. Load the Classification Unit data
 * 2. Load the Business Industry Code data
 * 3. Load the Ratebook XML
 */
class RateBookDataImporter_ACC {
  private static final var RATING_DATAFILES_PATH = "config/datafiles/rating/"
  private static final var ACC_RATE_BOOK_XML_FILE_NAME = "ACC Rating - 1.0.xml"
  private static final var ACC_RATE_BOOK_XML_FILE_CONTENT_TYPE = "text/xml"
  private static final var CLASSIFICATION_UNITS_01_FILE_NAME = "ClassificationUnits 1999 - 2018.xlsx"
  private static final var CLASSIFICATION_UNITS_02_FILE_NAME = "ClassificationUnits 2018 - 2021.xlsx"
  private static final var CLASSIFICATION_UNITS_03_FILE_NAME = "ClassificationUnits 2022 - 2024.xlsx"
  private static final var BUSINESS_INDUSTRY_CODES_01_FILE_NAME = "BIC data 2002 - 2009.xlsx"
  private static final var BUSINESS_INDUSTRY_CODES_02_FILE_NAME = "BIC data 2010 - 2014.xlsx"
  private static final var BUSINESS_INDUSTRY_CODES_03_FILE_NAME = "BIC data 2015 - 2018.xlsx"
  private static final var BUSINESS_INDUSTRY_CODES_04_FILE_NAME = "BIC data 2019 - 2021.xlsx"
  private static final var BUSINESS_INDUSTRY_CODES_05_FILE_NAME = "BIC data 2022 - 2024.xlsx"
  private static final var _logger = StructuredLogger.CONFIG.withClass(MethodHandles.lookup().lookupClass())
  construct() {
  }

  public function importUnitTestClassificationUnits() {
    logInfo("importUnitTestClassificationUnits", "STARTED - Importing Classification Units")
    ClassificationUnitExcelEntityConverter_ACC.resetPublicID()
    importClassificationUnits(RATING_DATAFILES_PATH, "test", CLASSIFICATION_UNITS_01_FILE_NAME)
    importClassificationUnits(RATING_DATAFILES_PATH, "test", CLASSIFICATION_UNITS_02_FILE_NAME)
    importClassificationUnits(RATING_DATAFILES_PATH, "test", CLASSIFICATION_UNITS_03_FILE_NAME)
    ClassificationUnitExcelEntityConverter_ACC.resetPublicID()
    logInfo("importUnitTestClassificationUnits", "FINISHED - Importing Classification Units")
  }

  public function importUnitTestBusinessIndustryCodes() {
    logInfo("importUnitTestBusinessIndustryCodes", "STARTED - Importing Business Industry Codes")
    importBusinessIndustryCodes(RATING_DATAFILES_PATH, "test", BUSINESS_INDUSTRY_CODES_01_FILE_NAME)
    importBusinessIndustryCodes(RATING_DATAFILES_PATH, "test", BUSINESS_INDUSTRY_CODES_02_FILE_NAME)
    importBusinessIndustryCodes(RATING_DATAFILES_PATH, "test", BUSINESS_INDUSTRY_CODES_03_FILE_NAME)
    importBusinessIndustryCodes(RATING_DATAFILES_PATH, "test", BUSINESS_INDUSTRY_CODES_04_FILE_NAME)
    importBusinessIndustryCodes(RATING_DATAFILES_PATH, "test", BUSINESS_INDUSTRY_CODES_05_FILE_NAME)
    logInfo("importUnitTestBusinessIndustryCodes", "FINISHED - Importing Business Industry Codes")
  }

  public function importUnitTestRatebook() {
    logInfo("importData", "STARTED - Importing Ratebook Data")
    importRatebook(RATING_DATAFILES_PATH, "test", ACC_RATE_BOOK_XML_FILE_NAME)
    logInfo("importData", "FINISHED - Importing Ratebook Data")
  }

  public function importData() : String {
    logInfo("importData", "STARTED - Importing Ratebook Data")
    var environmentPath = "test"

//    // Load CU Data
//    importClassificationUnits(RATING_DATAFILES_PATH, environmentPath, CLASSIFICATION_UNITS_01_FILE_NAME)
//    importClassificationUnits(RATING_DATAFILES_PATH, environmentPath, CLASSIFICATION_UNITS_02_FILE_NAME)
//    importClassificationUnits(RATING_DATAFILES_PATH, environmentPath, CLASSIFICATION_UNITS_03_FILE_NAME)

//    // Load BIC Data
//    importBusinessIndustryCodes(RATING_DATAFILES_PATH, environmentPath, BUSINESS_INDUSTRY_CODES_01_FILE_NAME)
//    importBusinessIndustryCodes(RATING_DATAFILES_PATH, environmentPath, BUSINESS_INDUSTRY_CODES_02_FILE_NAME)
//    importBusinessIndustryCodes(RATING_DATAFILES_PATH, environmentPath, BUSINESS_INDUSTRY_CODES_03_FILE_NAME)
//    importBusinessIndustryCodes(RATING_DATAFILES_PATH, environmentPath, BUSINESS_INDUSTRY_CODES_04_FILE_NAME)
//    importBusinessIndustryCodes(RATING_DATAFILES_PATH, environmentPath, BUSINESS_INDUSTRY_CODES_05_FILE_NAME)

    // Load ratebook
    importRatebook(RATING_DATAFILES_PATH, environmentPath, ACC_RATE_BOOK_XML_FILE_NAME)
    logInfo("importData", "FINISHED - Importing Ratebook Data")
    return DisplayKey.get("Web.Admin.ImportRateBook_ACC.RateBookSuccess")
  }

  private function importClassificationUnits(path : String, environmentPath : String, fileName : String) {
    var excelFile = readExcelFile(path, environmentPath, fileName)
    var fullPath = path + environmentPath + "/" + fileName
    if (excelFile != null) {
      var cuExcelEntityConverter = new ClassificationUnitExcelEntityConverter_ACC()
      var excelImporterExporter = new ExcelImporterExporter_ACC<ClassificationUnit_ACC>(cuExcelEntityConverter, false)
      logInfo("importClassificationUnits", "STARTED - Importing Classification Units from: " + fullPath)
      excelImporterExporter.importFromSpreadsheet(excelFile)
      logInfo("importClassificationUnits", "FINISHED - Importing Classification Units from: " + fullPath)
    }
  }

  private function importBusinessIndustryCodes(path : String, environmentPath : String, fileName : String) {
    var excelFile = readExcelFile(path, environmentPath, fileName)
    var fullPath = path + environmentPath + "/" + fileName
    if (excelFile != null) {
      var bicExcelEntityConverter = new BusinessIndustryCodeExcelEntityConverter_ACC()
      var excelImporterExporter = new ExcelImporterExporter_ACC<BusinessIndustryCode_ACC>(bicExcelEntityConverter, false)
      logInfo("importBusinessIndustryCodes", "STARTED - Importing Business Classification Codes from: " + fullPath)
      excelImporterExporter.importFromSpreadsheet(excelFile)
      logInfo("importBusinessIndustryCodes", "FINISHED - Importing Business Classification Codes from: " + fullPath)
    }
  }

  private function importRatebook(path : String, environmentPath : String, fileName : String) {
    var fullPath = path + environmentPath + "/" + fileName
    logInfo("importRatebook", "START - Importing Ratebook from: " + fullPath)
    var fileKey : SingleFileKey = null
    if (SingleFileKey.get(fileName) == null) { // lazy load
      fileKey = new SingleFileKey(fileName, fullPath, null, true, false, "The ACC Rate Book XML")
    } else {
      fileKey = SingleFileKey.get(fileName) as SingleFileKey
    }
    var accRateBookFile = fileKey.File
    var webFile = new SampleDataWebFile_ACC(accRateBookFile, fileName, ACC_RATE_BOOK_XML_FILE_CONTENT_TYPE)
    var importer = RateBookImporter.create()
    var importFileWrapper = new WebFileWrapper()
    importFileWrapper.File = webFile
    var testPath = ""
    var errorLogs = new String[0]
    var rateBookXMLImportUIHelper = new RateBookXMLImportUIHelper(importer, importFileWrapper, testPath, errorLogs)
    var webController = PLDependencies.getWebController()
    var request = webController.getRequest()
    if (request == null) { // this is being run in a unit test
      // Mock the HTTP request and response
      var mockHttpRequest = new MockHttpServletRequest_ACC()
      var session = new SmokeTestSessionMock()
      mockHttpRequest.Session = session
      var httpResponse = EasyMock.createMock(HttpServletResponse) as HttpServletResponse
      webController.setupRequestInfo(mockHttpRequest, httpResponse)
    }
    rateBookXMLImportUIHelper.doImport(false)
    logInfo("importRatebook", "FINISHED - Importing Ratebook from: " + fullPath)
  }

  private function readExcelFile(path : String, environmentPath : String, fileName : String) : XSSFWorkbook {
    var fullPath = path + environmentPath + "/" + fileName
    logInfo("readExcelFile", "Reading excel file: " + fullPath)
    try {
      var fileKey : SingleFileKey = null
      if (SingleFileKey.get(fileName) == null) { // lazy load
        fileKey = new SingleFileKey(fileName, fullPath, null, true, false, environmentPath + ": " + fileName)
      } else {
        fileKey = SingleFileKey.get(fileName) as SingleFileKey
      }
      ZipSecureFile.setMinInflateRatio(0.0) // prevents "IOException: Zip bomb detected!"
      return new XSSFWorkbook(fileKey.File)
    } catch (e : RuntimeException) {
      logError("readExcelFile", e.getMessage())
      throw new DisplayableException(DisplayKey.get("Web.Rating.Errors.InvalidSpecificExcelFile_ACC", fullPath))
    }
  }

  /**
   * Utility  method for logging info messages
   *
   * @param fn
   * @param msg
   */
  private function logInfo(fn : String, msg : String) {
_logger.info(msg)
  }

  /**
   * Utility  method for logging debug messages
   *
   * @param fn
   * @param msg
   */
  private function logDebug(fn : String, msg : String) {
    _logger.debug(msg)
  }

  /**
   * Utility  method for logging error messages
   *
   * @param fn
   * @param msg
   */
  private function logError(fn : String, msg : String) {
    _logger.error_ACC(msg)
  }
}