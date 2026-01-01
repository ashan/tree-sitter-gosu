package nz.co.acc.lob.common

uses com.guidewire.modules.key.SingleFileKey
uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses nz.co.acc.lob.common.excel.ExcelImporterExporter_ACC
uses nz.co.acc.lob.common.excel.InflationAdjustmentRatesExcelEntityConverter_ACC
uses nz.co.acc.lob.common.excel.MinMaxEarningsExcelEntityConverter_ACC

uses gw.surepath.suite.integration.logging.StructuredLogger
uses org.apache.poi.xssf.usermodel.XSSFWorkbook

uses java.io.FileInputStream
uses java.lang.invoke.MethodHandles

/**
 * Created by eliyaz on 5/09/2017.
 */
class MinMaxEarningsInflationAdjustmentImporter_ACC {
  private static final var DATA_FILES_PATH = "config/datafiles/"
  private static final var MINMAX_EARNINGS_TEST_FILE_NAME = "MinMaxEarnings_TEST_ACC.xlsx"
  private static final var INFLATION_RATES_TEST_FILE_NAME = "InflationAdjustmentRates_TEST_ACC.xlsx"
  private static final var _logger = StructuredLogger.CONFIG.withClass(MethodHandles.lookup().lookupClass())

  public static function importInflationAdjustmentRates(validateRows : boolean = true) : String {
    var inflationAdjFileName = INFLATION_RATES_TEST_FILE_NAME

    var excelFile = readExcelFile(DATA_FILES_PATH, inflationAdjFileName)
    var fullPath = DATA_FILES_PATH + inflationAdjFileName
    if (excelFile != null) {
      var InflationAdjustmentEntityConverter = new InflationAdjustmentRatesExcelEntityConverter_ACC()
      var excelImporterExporter = new ExcelImporterExporter_ACC<InflationAdjustment_ACC>(InflationAdjustmentEntityConverter, validateRows)
      logInfo("importInflationAdjustmentRates", "STARTED - Importing InflationAdjustmentRates from: " + fullPath)
      excelImporterExporter.importFromSpreadsheet(excelFile)
      logInfo("importInflationAdjustmentRates", "FINISHED - Importing InflationAdjustmentRates from: " + fullPath)
    }
    return DisplayKey.get("Web.Admin.Import.InflationAdjSuccess_ACC", "Test")
  }


  public static function importMinMaxEarnings(validateRows : boolean = true) : String{
    var minMaxFileName = MINMAX_EARNINGS_TEST_FILE_NAME

    var excelFile = readExcelFile(DATA_FILES_PATH, minMaxFileName)
    var fullPath = DATA_FILES_PATH + minMaxFileName
    if (excelFile != null) {
      var minMaxEarningsEntityConverter = new MinMaxEarningsExcelEntityConverter_ACC()
      var excelImporterExporter = new ExcelImporterExporter_ACC<EarningsMinMaxData_ACC>(minMaxEarningsEntityConverter, validateRows)
      logInfo("importMinMaxEarnings", "STARTED - Importing MinMaxEarnings from: " + fullPath)
      excelImporterExporter.importFromSpreadsheet(excelFile)
      logInfo("importMinMaxEarnings", "FINISHED - Importing MinMaxEarnings from: " + fullPath)
    }
    return DisplayKey.get("Web.Admin.Import.MinMaxEarningsSuccess_ACC", "Test")
  }

  private static function readExcelFile(path : String, fileName : String) : XSSFWorkbook {
    var fullPath = path + fileName
    logInfo("readExcelFile", "Reading excel file: " + fullPath)
    try {
      var fileKey : SingleFileKey = null
      if (SingleFileKey.get(fileName) == null) { // lazy load
        fileKey = new SingleFileKey(fileName, fullPath, null, true, false, ": " + fileName)
      } else {
        fileKey = SingleFileKey.get(fileName) as SingleFileKey
      }
      var inputFile = fileKey.File
      using(var inputStream = new FileInputStream(inputFile)) {
        return new XSSFWorkbook(inputStream)
      }
    } catch (e : RuntimeException) {
      logError("readExcelFile", e.getMessage())
      throw new DisplayableException(DisplayKey.get("Web.Rating.Errors.InvalidSpecificExcelFile_ACC", fullPath))
    }
  }

  /**
   * Utility  method for logging info messages
   * @param fn
   * @param msg
   */
  private static function logInfo(fn: String, msg: String) {
    _logger.info(msg)
  }

  /**
   * Utility  method for logging debug messages
   * @param fn
   * @param msg
   */
  private static function logDebug(fn: String, msg: String) {
    _logger.info(msg)
  }

  /**
   * Utility  method for logging error messages
   * @param fn
   * @param msg
   */
  private static function logError(fn: String, msg: String) {
   _logger.error_ACC(msg)
  }
}