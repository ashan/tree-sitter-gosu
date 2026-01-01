package nz.co.acc.gwer.bulkupload.sheetprocessor

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.integration.bulkupload.BulkUploadProcessUpdater
uses nz.co.acc.common.integration.bulkupload.error.RowProcessError
uses nz.co.acc.gwer.bulkupload.row.ERCULRGMappingRow
uses nz.co.acc.gwer.bulkupload.xlsprocessor.AbstractXLSSheetProcessor
uses nz.co.acc.gwer.bulkupload.xlsprocessor.XLSProcessorResult
uses org.apache.poi.ss.usermodel.Cell
uses org.apache.poi.ss.usermodel.Sheet
uses nz.co.acc.gwer.bulkupload.error.XLSRowProcessError

/**
 * Processes a CSV file to update account statuses.
 * Created by HamblyAl on 18/03/2019.
 */
class ERCULRGMappingProcessor extends AbstractXLSSheetProcessor {
  public static var SHEET_NAME : String = "er_cu_lrg_mapping"
  construct(updater : BulkUploadProcessUpdater, sheet : Sheet) {
    super(updater, sheet)
    _log = StructuredLogger.CONFIG.withClass(ERCULRGMappingProcessor)
  }

  public static function newInstance(
      updater : BulkUploadProcessUpdater,
      sheet : Sheet) : ERCULRGMappingProcessor {
    return new ERCULRGMappingProcessor(updater, sheet)
  }

  function processRows(parsedRows : List<ERCULRGMappingRow>) : XLSProcessorResult {
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
//                  rowProcessErrors.add(new XLSRowProcessError(SHEET_NAME, lineNumber, e.Message))
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
//        _log.error_ACC("processSheet error processing sheet", e)
//        onFailure()
//      }
//
//    } else {
//      _log.error_ACC("Sheet is NULL")
//    }
//    _log.info("Sheet processing done ${SHEET_NAME}")
//    return new XLSProcessorResult(rowsSuccessful, rowProcessErrors, null)
//  }

  override function processRow(list : List<Cell>) {
    var erModRow = new ERCULRGMappingRow()
    erModRow.levyApplicationYearNBR = Double.valueOf(list.get(0).NumericCellValue).intValue()
    erModRow.levyYearNBR = Double.valueOf(list.get(1).NumericCellValue).intValue()
    erModRow.cuCode =    String.valueOf(Double.valueOf(list.get(2).NumericCellValue).intValue())
    erModRow.cuDescription = list.get(3).StringCellValue
    erModRow.lrgCode = Double.valueOf(list.get(4).NumericCellValue).intValue()
    erModRow.active = list.get(5).StringCellValue.equalsIgnoreCase("y")

    _log.info("processSheet ${erModRow.toString()}")
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\b -> {
      var paramCU = getParamCU(erModRow)
      var paramLRG = getParamLRG(erModRow)
      var param = getRecord(erModRow)

      if(param == null) {
        param = new ERParamCU_LRGMapping_ACC()
      } else {
        param = b.add(param)
      }
      param.ERParamCU = paramCU
      param.ERParamLRG = paramLRG
      param.IsActive = erModRow.Active
    })
    _log.info("processSheet parameter added ${erModRow.toString()}")
  }

  function getRecord(row : ERCULRGMappingRow) : ERParamCU_LRGMapping_ACC {
    var erParamQuery = Query.make(ERParamCU_LRGMapping_ACC)
    var erParamCUQuery = erParamQuery.join(ERParamCU_LRGMapping_ACC#ERParamCU)
        erParamCUQuery.compare(ERParamCU_ACC#LevyApplicationYear, Relop.Equals, row.LevyApplicationYear)
        erParamCUQuery.compare(ERParamCU_ACC#LevyYear, Relop.Equals, row.levyYearNBR)
    var erParamLRGQuery = erParamQuery.join(ERParamCU_LRGMapping_ACC#ERParamLRG)
    erParamLRGQuery.compare(ERParamLRG_ACC#LevyApplicationYear, Relop.Equals, row.LevyApplicationYear)
    erParamLRGQuery.compare(ERParamLRG_ACC#LRGCode, Relop.Equals, row.LRGCode)
    var results = erParamQuery.select()
    _log.info("getRecord ${row.toString()}")
    return results.AtMostOneRow
  }

  function getParamLRG(row : ERCULRGMappingRow) : ERParamLRG_ACC {
    var erParamCUQuery = Query.make(ERParamLRG_ACC)
    erParamCUQuery.compare(ERParamLRG_ACC#LevyApplicationYear, Relop.Equals, row.LevyApplicationYear)
    erParamCUQuery.compare(ERParamLRG_ACC#LRGCode, Relop.Equals, row.lrgCode)
    return erParamCUQuery.select().AtMostOneRow
  }

  function getParamCU(row : ERCULRGMappingRow) : ERParamCU_ACC {
    var erParamCUQuery = Query.make(ERParamCU_ACC)
    erParamCUQuery.compare(ERParamCU_ACC#LevyApplicationYear, Relop.Equals, row.LevyApplicationYear)
    erParamCUQuery.compare(ERParamCU_ACC#LevyYear, Relop.Equals, row.levyYearNBR)
    erParamCUQuery.compare(ERParamCU_ACC#CUCode, Relop.Equals, row.CUCode)
    return erParamCUQuery.select().AtMostOneRow
  }
}