package nz.co.acc.gwer.bulkupload.sheetprocessor

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.integration.bulkupload.BulkUploadProcessUpdater
uses nz.co.acc.gwer.bulkupload.error.XLSRowProcessError
uses nz.co.acc.gwer.bulkupload.parser.ERParameterValueParser
uses nz.co.acc.gwer.bulkupload.row.ERLevyRiskGroupsRow
uses nz.co.acc.gwer.bulkupload.xlsprocessor.AbstractXLSSheetProcessor
uses nz.co.acc.gwer.bulkupload.xlsprocessor.XLSProcessorResult
uses org.apache.poi.ss.usermodel.Cell
uses org.apache.poi.ss.usermodel.Sheet

/**
 * Processes a CSV file to update account statuses.
 * Created by HamblyAl on 18/03/2019.
 */
class ERLevyRiskGroupsProcessor extends AbstractXLSSheetProcessor {
  public static var SHEET_NAME : String = "er_levy_risk_groups"
  var _erParamValues : ArrayList<ERParamValue_ACC>
  construct(updater : BulkUploadProcessUpdater, sheet : Sheet) {
    super(updater, sheet)
    _erParamValues = new ArrayList<ERParamValue_ACC>()
    _log = StructuredLogger.CONFIG.withClass(ERLevyRiskGroupsProcessor)
  }

  public static function newInstance(
      updater : BulkUploadProcessUpdater,
      sheet : Sheet) : ERLevyRiskGroupsProcessor {
    var parser = new ERParameterValueParser()
    return new ERLevyRiskGroupsProcessor(updater, sheet)
  }

  function processRows(parsedRows : List<ERLevyRiskGroupsRow>) : XLSProcessorResult {
    return null
  }

  private function createComment() : String {
    var comment = new StringBuilder()
    return comment.toString()
  }

  private function checkParameterCode(code : String) : ERParamValue_ACC {
    return null
  }

  override property get SheetName() : String {
    return SHEET_NAME
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
//        }
//      }
//    } else {
//      _log.error_ACC("Sheet is NULL")
//    }
//    _log.info("Sheet processing done ${SHEET_NAME}")
//    return new XLSProcessorResult(rowsSuccessful, rowProcessErrors, null)
//  }

  override function processRow(list : List<Cell>) {
    var levyYear = Double.valueOf(list.get(0).NumericCellValue).intValue()
    var lrgCode = Integer.valueOf(list.get(1).StringCellValue)
    var paramValue = list.get(2).StringCellValue
    _log.info("processSheet ${levyYear}, ${lrgCode} ${paramValue}")
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\b -> {
      var param = getRecord(levyYear, lrgCode)
      if(param == null) {
        param = new ERParamLRG_ACC()
      } else {
        param = b.add(param)
      }

      param.LevyApplicationYear = levyYear
      param.LRGCode = lrgCode
      param.LRGDesc = paramValue
    })
    _log.info("processSheet parameter added ${levyYear}, ${lrgCode} ${paramValue}")
  }

  function getRecord(levyYear : Integer, lrgCode : Integer) : ERParamLRG_ACC {
    var erParamQuery = Query.make(ERParamLRG_ACC)
        erParamQuery.compare(ERParamLRG_ACC#LevyApplicationYear, Relop.Equals, levyYear)
        erParamQuery.compare(ERParamLRG_ACC#LRGCode, Relop.Equals, lrgCode)
    var results = erParamQuery.select()
    _log.info("checkIfERParamValueExists ${levyYear} ${lrgCode} ${results.HasElements}")
    return results.FirstResult
  }
}