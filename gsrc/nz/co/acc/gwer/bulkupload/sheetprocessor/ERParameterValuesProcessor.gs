package nz.co.acc.gwer.bulkupload.sheetprocessor

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.integration.bulkupload.BulkUploadProcessUpdater
uses nz.co.acc.gwer.bulkupload.error.XLSRowProcessError
uses nz.co.acc.gwer.bulkupload.parser.ERParameterValueParser
uses nz.co.acc.gwer.bulkupload.row.ERParameterValueRow
uses nz.co.acc.gwer.bulkupload.xlsprocessor.AbstractXLSSheetProcessor
uses nz.co.acc.gwer.bulkupload.xlsprocessor.XLSProcessorResult
uses org.apache.poi.ss.usermodel.Cell
uses org.apache.poi.ss.usermodel.Sheet

/**
 * Processes a CSV file to update account statuses.
 * Created by HamblyAl on 18/03/2019.
 */
class ERParameterValuesProcessor extends AbstractXLSSheetProcessor {
  public static var SHEET_NAME : String = "er_parameter_values"
  var _erParamValues : ArrayList<ERParamValue_ACC>
  var levyYear : Integer
  var paramCode : ERParametersCode_ACC
  var paramValue : String

  construct(updater : BulkUploadProcessUpdater, sheet : Sheet) {
    super(updater, sheet)
    _erParamValues = new ArrayList<ERParamValue_ACC>()
    _log = StructuredLogger.CONFIG.withClass(ERParameterValuesProcessor)
  }

  public static function newInstance(
      updater : BulkUploadProcessUpdater,
      sheet : Sheet) : ERParameterValuesProcessor {
    var parser = new ERParameterValueParser()
    return new ERParameterValuesProcessor(updater, sheet)
  }

  function processRows(parsedRows : List<ERParameterValueRow>) : XLSProcessorResult {
    return null
  }

  private function createComment() : String {
    var comment = new StringBuilder()
    return comment.toString()
  }

  private function checkParameterCode(code : String) : ERParamValue_ACC {
    return null
  }

//  override function processSheet() : XLSProcessorResult {
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
    levyYear = Integer.valueOf(list.get(0).StringCellValue)
    paramCode = ERParametersCode_ACC.get(list.get(1).StringCellValue)
    paramValue = list.get(2).StringCellValue
    _log.info("processSheet ${levyYear}, ${paramCode.Code} ${paramValue}")
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\b -> {
      var param = Record
      if(param == null) {
        param = new ERParamValue_ACC()
      } else {
        param = b.add(param)
      }
      param.LevyApplicationYear = levyYear
      param.ERParameterCode = paramCode
      param.ERParameterValue = paramValue
    })
  }

  property get Record() : ERParamValue_ACC {
    var erParamQuery = Query.make(ERParamValue_ACC)
    erParamQuery.compare(ERParamValue_ACC#LevyApplicationYear, Relop.Equals, levyYear)
    erParamQuery.compare(ERParamValue_ACC#ERParameterCode, Relop.Equals, paramCode)
    var results = erParamQuery.select()
    _log.info("checkIfERParamValueExists ${levyYear} ${paramCode} ${results.HasElements}")
    return results.FirstResult
  }

  override property get SheetName() : String {
    return SHEET_NAME
  }
}