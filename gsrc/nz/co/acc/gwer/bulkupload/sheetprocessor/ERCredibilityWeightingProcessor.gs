package nz.co.acc.gwer.bulkupload.sheetprocessor

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.pl.currency.MonetaryAmount
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.integration.bulkupload.BulkUploadProcessUpdater
uses nz.co.acc.common.integration.bulkupload.error.RowProcessError
uses nz.co.acc.gwer.bulkupload.error.XLSRowProcessError
uses nz.co.acc.gwer.bulkupload.parser.ERParameterValueParser
uses nz.co.acc.gwer.bulkupload.row.ERCredibilityWeightingRow
uses nz.co.acc.gwer.bulkupload.row.EREModDiscountLoadingStepsRow
uses nz.co.acc.gwer.bulkupload.xlsprocessor.AbstractXLSSheetProcessor
uses nz.co.acc.gwer.bulkupload.xlsprocessor.XLSProcessorResult
uses org.apache.poi.ss.usermodel.Cell
uses org.apache.poi.ss.usermodel.Sheet
/**
 * Processes a CSV file to update account statuses.
 * Created by HamblyAl on 18/03/2019.
 */
class ERCredibilityWeightingProcessor extends AbstractXLSSheetProcessor {
  public static var SHEET_NAME : String = "er_credibility_weighting"
  var _erParamValues : ArrayList<ERParamValue_ACC>
  construct(updater : BulkUploadProcessUpdater, sheet : Sheet) {
    super(updater, sheet)
    _erParamValues = new ArrayList<ERParamValue_ACC>()
    _log = StructuredLogger.CONFIG.withClass(ERCredibilityWeightingProcessor)
  }

  public static function newInstance(
      updater : BulkUploadProcessUpdater,
      sheet : Sheet) : ERCredibilityWeightingProcessor {
    var parser = new ERParameterValueParser()
    return new ERCredibilityWeightingProcessor(updater, sheet)
  }

  function processRows(parsedRows : List<EREModDiscountLoadingStepsRow>) : XLSProcessorResult {
    return null
  }

  private function createComment() : String {
    var comment = new StringBuilder()
    return comment.toString()
  }

  private function checkParameterCode(code : String) : ERParamValue_ACC {
    return null
  }

//  function processSheet() : XLSProcessorResult {
//    _log.info("Sheet processing started ${SHEET_NAME}")
//    var rowsSuccessful = 0
//    var lineNumber = 0
//    var recordNumber = 0
//    var rowProcessErrors = new ArrayList<XLSRowProcessError>()
//    if(_sheet != null) {
//      var rowIterator = _sheet.rowIterator()
//      if(rowIterator.hasNext()) {
//        rowIterator.next()
//        while(rowIterator.hasNext()) {
//          var row = rowIterator.next()
//          var cellIterator = row.cellIterator()
//          if(cellIterator.hasNext()) {
//            var list = cellIterator.toList()
//            _log.info("processSheet ${cellIterator.toString()}")
//            var empty = list.hasMatch(\elt -> elt.CellType == BLANK)
//            if(list.HasElements and !empty) {
//              try {
//                processRow(list)
//                rowsSuccessful += 1
//                onSuccess()
//              } catch (e : Exception) {
//                _log.error_ACC("processSheet error processing row", e)
//                rowProcessErrors.add(new XLSRowProcessError(SHEET_NAME, lineNumber, e.Message))
//                onFailure()
//              }
//            } else {
//              _log.error_ACC("processSheet row has empty cells")
//              onFailure()
//            }
//          }
//          lineNumber += 1
//        }
//      }
//    } else {
//      _log.error_ACC("Sheet is NULL")
//    }
//    _log.info("Sheet processing done ${SHEET_NAME}")
//    return new XLSProcessorResult(rowsSuccessful, rowProcessErrors, null)
//  }

  override function processRow(list : List<Cell>) {
    var erModRow = new ERCredibilityWeightingRow()
    erModRow.LevyYear = Double.valueOf(list.get(0).NumericCellValue).intValue()
    erModRow.CredibilityWeightingBand = Double.valueOf(list.get(1).NumericCellValue).intValue()
    erModRow.CredibilityWtLowerLimit = Double.valueOf(list.get(2).NumericCellValue).intValue()
    erModRow.CredibilityWtUpperLimit = Double.valueOf(list.get(3).NumericCellValue).intValue()
    erModRow.BandCredibilityWt = Double.valueOf(list.get(4).NumericCellValue).intValue()
    erModRow.MinLiableEarnings = Double.valueOf(list.get(5).NumericCellValue).intValue()
    erModRow.MaxLiableEarnings = Double.valueOf(list.get(6).NumericCellValue).intValue()
    erModRow.BandLiableEarnings = Double.valueOf(list.get(7).NumericCellValue).intValue()

    _log.info("processSheet ${erModRow.toString()}")

    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\b -> {
      var param = getRecord(erModRow)
      if(param == null) {
        param = new ERParamCredibleWeight_ACC()
      } else {
        param = b.add(param)
      }
      param.LevyApplicationYear = erModRow.LevyYear
      param.CredibilityWeightingBand = erModRow.CredibilityWeightingBand
      param.CredibilityWtLowerLimit = erModRow.CredibilityWtLowerLimit
      param.CredibilityWtUpperLimit = erModRow.CredibilityWtUpperLimit
      param.BandCredibilityWt = erModRow.BandCredibilityWt
      param.MinLiableEarnings = new MonetaryAmount(erModRow.MinLiableEarnings, Currency.TC_NZD)
      param.MaxLiableEarnings = new MonetaryAmount(erModRow.MaxLiableEarnings, Currency.TC_NZD)
      param.BandLiableEarnings = new MonetaryAmount(erModRow.BandLiableEarnings, Currency.TC_NZD)
    })
    _log.info("processSheet parameter added ${erModRow.toString()}")
  }

  function getRecord(row : ERCredibilityWeightingRow) : ERParamCredibleWeight_ACC {
    var erParamQuery = Query.make(ERParamCredibleWeight_ACC)
        erParamQuery.compare(ERParamCredibleWeight_ACC#LevyApplicationYear, Relop.Equals, row.levyYear)
        erParamQuery.compare(ERParamCredibleWeight_ACC#CredibilityWeightingBand, Relop.Equals, row.CredibilityWeightingBand)
        erParamQuery.compare(ERParamCredibleWeight_ACC#CredibilityWtLowerLimit, Relop.Equals, row.CredibilityWtLowerLimit)
        erParamQuery.compare(ERParamCredibleWeight_ACC#CredibilityWtUpperLimit, Relop.Equals, row.CredibilityWtUpperLimit)
    var results = erParamQuery.select()
    _log.info("checkIfERParamValueExists ${row.toString()}")
    return results.AtMostOneRow
  }

  override property get SheetName() : String {
    return SHEET_NAME
  }
}