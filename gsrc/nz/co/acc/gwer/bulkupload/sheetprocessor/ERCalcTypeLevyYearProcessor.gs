package nz.co.acc.gwer.bulkupload.sheetprocessor

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.integration.bulkupload.BulkUploadProcessUpdater
uses nz.co.acc.common.integration.bulkupload.error.RowProcessError
uses nz.co.acc.gwer.bulkupload.parser.ERParameterValueParser
uses nz.co.acc.gwer.bulkupload.row.ERCalcTypeLevyYearRow
uses nz.co.acc.gwer.bulkupload.xlsprocessor.AbstractXLSSheetProcessor
uses nz.co.acc.gwer.bulkupload.xlsprocessor.XLSProcessorResult
uses org.apache.poi.ss.usermodel.Sheet
uses org.apache.poi.ss.usermodel.CellType
uses org.apache.poi.ss.usermodel.Cell
uses nz.co.acc.gwer.bulkupload.error.XLSRowProcessError

/**
 * Processes a CSV file to update account statuses.
 * Created by HamblyAl on 18/03/2019.
 */
class ERCalcTypeLevyYearProcessor extends AbstractXLSSheetProcessor {
  public static var SHEET_NAME : String = "er_calctype_levyyear"
  construct(updater : BulkUploadProcessUpdater, sheet : Sheet) {
    super(updater, sheet)
    _log = StructuredLogger.CONFIG.withClass(ERCalcTypeLevyYearProcessor)
  }

  public static function newInstance(
      updater : BulkUploadProcessUpdater,
      sheet : Sheet) : ERCalcTypeLevyYearProcessor {
    var parser = new ERParameterValueParser()
    return new ERCalcTypeLevyYearProcessor(updater, sheet)
  }

  function processRows(parsedRows : List<ERCalcTypeLevyYearRow>) : XLSProcessorResult {
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
//    var lineNumber = 1
//    var recordNumber = 0
//
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
//              _log.info("processSheet cell count ${list.Count}")
//              var empty = list.hasMatch(\elt -> elt.CellType == BLANK)
//              if(list.HasElements and !empty) {
//                try {
//                  processRow(list)
//                  rowsSuccessful += 1
//                  onSuccess()
//                } catch (e: Exception) {
//                  _log.error_ACC("processSheet error row processing", e)
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
//        _log.error_ACC("processSheet error on sheet processing", e)
//        onFailure()
//      }
//    } else {
//      _log.error_ACC("Sheet is NULL")
//    }
//    _log.info("Sheet processing done ${SHEET_NAME}")
//    return new XLSProcessorResult(rowsSuccessful, rowProcessErrors, null)
//  }

  override function processRow(list : List<Cell>) {
    var erRow = new ERCalcTypeLevyYearRow()
    erRow.levyApplicationYear = Double.valueOf(list.get(0).NumericCellValue).intValue()
    erRow.programme = ERProgramme_ACC.get(list.get(1).StringCellValue)
    erRow.calcType = ERCalculationType_ACC.AllTypeKeys.firstWhere(\elt -> elt.Name.equalsIgnoreCase(list.get(2).StringCellValue))
    _log.info("processSheet ${erRow.toString()}")
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\b -> {
      var param = getRecord(erRow)

      if (param == null) {
        param = new ERCalcTypeLevyYear_ACC()
      } else {
        param = b.add(param)
      }

      param.LevyYear = erRow.levyApplicationYear
      param.ERProgramme = erRow.programme
      param.ERCalculationType = erRow.calcType
    })
    _log.info("processSheet parameter added ${erRow.toString()}")
  }

  function getRecord(row : ERCalcTypeLevyYearRow) : ERCalcTypeLevyYear_ACC {
    var erParamQuery = Query.make(ERCalcTypeLevyYear_ACC)
        erParamQuery.compare(ERCalcTypeLevyYear_ACC#ERProgramme, Relop.Equals, row.programme)
        erParamQuery.compare(ERCalcTypeLevyYear_ACC#LevyYear, Relop.Equals, row.LevyApplicationYear)
    var results = erParamQuery.select()
    _log.info("checkIfERParamValueExists ${row.toString()}")
    return results.FirstResult
  }
}