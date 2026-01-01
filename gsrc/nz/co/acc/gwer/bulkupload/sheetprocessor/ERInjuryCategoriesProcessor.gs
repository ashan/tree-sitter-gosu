package nz.co.acc.gwer.bulkupload.sheetprocessor

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.integration.bulkupload.BulkUploadProcessUpdater
uses nz.co.acc.gwer.bulkupload.error.XLSRowProcessError
uses nz.co.acc.gwer.bulkupload.parser.ERParameterValueParser
uses nz.co.acc.gwer.bulkupload.row.ERInjuryCategoriesRow
uses nz.co.acc.gwer.bulkupload.xlsprocessor.AbstractXLSSheetProcessor
uses nz.co.acc.gwer.bulkupload.xlsprocessor.XLSProcessorResult
uses org.apache.poi.ss.usermodel.Cell
uses org.apache.poi.ss.usermodel.Sheet

/**
 * Processes a CSV file to update account statuses.
 * Created by HamblyAl on 18/03/2019.
 */
class ERInjuryCategoriesProcessor extends AbstractXLSSheetProcessor {
  public static var SHEET_NAME : String = "er_injury_categories"
  construct(updater : BulkUploadProcessUpdater, sheet : Sheet) {
    super(updater, sheet)
    _log = StructuredLogger.CONFIG.withClass(ERInjuryCategoriesProcessor)
  }

  public static function newInstance(
      updater : BulkUploadProcessUpdater,
      sheet : Sheet) : ERInjuryCategoriesProcessor {
    var parser = new ERParameterValueParser()
    return new ERInjuryCategoriesProcessor(updater, sheet)
  }

  function processRows(parsedRows : List<ERInjuryCategoriesRow>) : XLSProcessorResult {
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
    var erRow = new ERInjuryCategoriesRow()
    erRow.levyApplicationYear = Double.valueOf(list.get(0).NumericCellValue).intValue()
    erRow.injuryCategory = list.get(1).StringCellValue
    erRow.experienceRatingInd = list.get(2).StringCellValue.equalsIgnoreCase("y")
    _log.info("processSheet ${erRow.toString()}")
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\b -> {
      var param = getRecord(erRow)
      if(param == null) {
        param = new ERParamInjuryCategory_ACC()
      } else {
        param = b.add(param)
      }
      param.LevyApplicationYear = erRow.levyApplicationYear
      param.InjuryCategory = erRow.injuryCategory
      param.ExperienceRatingInd = erRow.experienceRatingInd
    })
    _log.info("processSheet parameter added ${erRow.toString()}")
  }

  function getRecord(row : ERInjuryCategoriesRow) : ERParamInjuryCategory_ACC {
    var erParamQuery = Query.make(ERParamInjuryCategory_ACC)
        erParamQuery.compare(ERParamInjuryCategory_ACC#LevyApplicationYear, Relop.Equals, row.levyApplicationYear)
        erParamQuery.compare(ERParamInjuryCategory_ACC#InjuryCategory, Relop.Equals, row.injuryCategory)
    var results = erParamQuery.select()
    _log.info("checkIfERParamValueExists ${row.toString()}")
    return results.AtMostOneRow
  }

  override property get SheetName() : String {
    return SHEET_NAME
  }
}