package nz.co.acc.gwer.bulkupload.sheetprocessor

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.integration.bulkupload.BulkUploadProcessUpdater
uses nz.co.acc.gwer.bulkupload.error.XLSRowProcessError
uses nz.co.acc.gwer.bulkupload.parser.ERParameterValueParser
uses nz.co.acc.gwer.bulkupload.row.ERStepAdjustmentRow
uses nz.co.acc.gwer.bulkupload.xlsprocessor.AbstractXLSSheetProcessor
uses nz.co.acc.gwer.bulkupload.xlsprocessor.XLSProcessorResult
uses org.apache.poi.ss.usermodel.Cell
uses org.apache.poi.ss.usermodel.Sheet

/**
 * Processes a CSV file to update account statuses.
 * Created by HamblyAl on 18/03/2019.
 */
class ERStepAdjustmentProcessor extends AbstractXLSSheetProcessor {
  public static var SHEET_NAME : String = "er_step_adjustment"
  construct(updater : BulkUploadProcessUpdater, sheet : Sheet) {
    super(updater, sheet)
    _log = StructuredLogger.CONFIG.withClass(ERStepAdjustmentProcessor)
  }

  public static function newInstance(
      updater : BulkUploadProcessUpdater,
      sheet : Sheet) : ERStepAdjustmentProcessor {
    var parser = new ERParameterValueParser()
    return new ERStepAdjustmentProcessor(updater, sheet)
  }

  function processRows(parsedRows : List<ERStepAdjustmentRow>) : XLSProcessorResult {
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

//  function processSheet() : XLSProcessorResult {
//    _log.info("Sheet processing started ${SHEET_NAME}")
//    var rowsSuccessful = 0
//    var lineNumber = 0
//    var recordNumber = 0
//    var rowProcessErrors = new ArrayList<XLSRowProcessError>()
//    if(_sheet != null) {
//      try {
//        var rowIterator = _sheet.rowIterator()
//        if(rowIterator.hasNext()) {
//          rowIterator.next()
//          while(rowIterator.hasNext()) {
//            var row = rowIterator.next()
//            var cellIterator = row.cellIterator()
//            if(cellIterator.hasNext()) {
//              var list = cellIterator.toList()
//              _log.info("processSheet ${cellIterator.toString()}")
//              var empty = list.hasMatch(\elt -> elt.CellType == BLANK)
//              if(list.HasElements and !empty) {
//                try {
//                  processRow(list)
//                  rowsSuccessful += 1
//                  onSuccess()
//                } catch (e : Exception) {
//                  _log.error_ACC("processSheet error processing row", e)
//                  onFailure()
//                }
//              } else {
//                _log.error_ACC("processSheet row has empty cells")
//                onFailure()
//              }
//            }
//            lineNumber += 1
//          }
//        }
//      } catch (e : Exception) {
//        _log.error_ACC("processSheet processing error", e)
//        onFailure()
//      }
//    } else {
//      _log.error_ACC("Sheet is NULL")
//    }
//    _log.info("Sheet processing done ${SHEET_NAME}")
//    return new XLSProcessorResult(rowsSuccessful, rowProcessErrors, null)
//  }

  override function processRow(list : List<Cell>) {
    var erRow = new ERStepAdjustmentRow()
    erRow.levyApplicationYear = Double.valueOf(list.get(0).NumericCellValue).intValue()
    erRow.year1Adjustment = Double.valueOf(list.get(1).NumericCellValue).intValue()
    erRow.year2Adjustment = Double.valueOf(list.get(2).NumericCellValue).intValue()
    erRow.year3Adjustment = Double.valueOf(list.get(3).NumericCellValue).intValue()
    _log.info("processSheet ${erRow.toString()}")
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\b -> {
      var param = getRecord(erRow)
      if (param == null) {
        param = new ERParamStepAdj_ACC()
      } else {
        param = b.add(param)
      }

      param.LevyApplicationYear = erRow.levyApplicationYear
      param.Year1Adjustment = erRow.year1Adjustment
      param.Year2Adjustment = erRow.year2Adjustment
      param.Year3Adjustment = erRow.year3Adjustment
    })
    _log.info("processSheet parameter added ${erRow.toString()}")
  }

  function getRecord(row : ERStepAdjustmentRow) : ERParamStepAdj_ACC {
    var erParamQuery = Query.make(ERParamStepAdj_ACC)
        erParamQuery.compare(ERParamClaimsExcluded_ACC#LevyApplicationYear, Relop.Equals, row.levyApplicationYear)
    var results = erParamQuery.select()
    _log.info("checkIfERParamValueExists ${row.toString()}")
    return results.FirstResult
  }
}