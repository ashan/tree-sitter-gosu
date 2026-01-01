package nz.co.acc.gwer.bulkupload.sheetprocessor

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.integration.bulkupload.BulkUploadProcessUpdater
uses nz.co.acc.gwer.bulkupload.error.XLSRowProcessError
uses nz.co.acc.gwer.bulkupload.parser.ERParameterValueParser
uses nz.co.acc.gwer.bulkupload.row.ERLRGParametersValuesRow
uses nz.co.acc.gwer.bulkupload.xlsprocessor.AbstractXLSSheetProcessor
uses nz.co.acc.gwer.bulkupload.xlsprocessor.XLSProcessorResult
uses org.apache.poi.ss.usermodel.Cell
uses org.apache.poi.ss.usermodel.Sheet

/**
 * Processes a CSV file to update account statuses.
 * Created by HamblyAl on 18/03/2019.
 */
class ERLRGParameterValuesProcessor extends AbstractXLSSheetProcessor {
  public static var SHEET_NAME : String = "er_lrg_parameter_values"
  construct(updater : BulkUploadProcessUpdater, sheet : Sheet) {
    super(updater, sheet)
    _log = StructuredLogger.CONFIG.withClass(ERLRGParameterValuesProcessor)
  }

  public static function newInstance(
      updater : BulkUploadProcessUpdater,
      sheet : Sheet) : ERLRGParameterValuesProcessor {
    var parser = new ERParameterValueParser()
    return new ERLRGParameterValuesProcessor(updater, sheet)
  }

  function processRows(parsedRows : List<ERLRGParametersValuesRow>) : XLSProcessorResult {
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
    var erModRow = new ERLRGParametersValuesRow()
    erModRow.LevyYear = Double.valueOf(list.get(0).NumericCellValue).intValue()
    erModRow.ExperienceYear = Double.valueOf(list.get(1).NumericCellValue).intValue()
    erModRow.LevyRiskGroupCode = Double.valueOf(list.get(2).NumericCellValue).intValue()
    erModRow.LevyRiskGroupDescription = list.get(3).StringCellValue
    erModRow.ExpRehabMgtRateMedEmp = list.get(4).NumericCellValue
    erModRow.ExpRiskMgtRateMedEmp = list.get(5).NumericCellValue
    erModRow.ExpRehabMgtRateLgeEmp = list.get(6).NumericCellValue
    erModRow.ExpRiskMgtRateLgeEmp = list.get(7).NumericCellValue
    erModRow.IndustrySizeModMedEmp = list.get(8).NumericCellValue
    erModRow.IndustrySizeModLgeEmp = list.get(9).NumericCellValue
    erModRow.LrgRehabMgtRate = list.get(10).NumericCellValue

    _log.info("processSheet ${erModRow.toString()}")

    var paramLRG = getParamLRG(erModRow)
    if(paramLRG != null) {
      gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\b -> {
        var param = getRecord(erModRow)
        if (param == null) {
          param = new ERLRGParametersValue_ACC()
        } else {
          param = b.add(param)
        }

        param.ExperienceYear = erModRow.ExperienceYear
        param.ExpectedRehabMgmtRate_MedEmp = erModRow.ExpRehabMgtRateMedEmp
        param.ExpectedRiskMgmtRate_MedEmp = erModRow.ExpRiskMgtRateMedEmp
        param.ExpectedRehabMgmtRate_LgeEmp = erModRow.ExpRehabMgtRateLgeEmp
        param.ExpectedRiskMgmtRate_LgeEmp = erModRow.ExpRiskMgtRateLgeEmp
        param.IndustrySizeModifier_MedEmp = erModRow.IndustrySizeModMedEmp
        param.IndustrySizeModifier_LgeEmp = erModRow.IndustrySizeModLgeEmp
        param.LRGRehabMgmtRate = erModRow.LrgRehabMgtRate
        param.ERParamLRG = paramLRG
      })
    }
    _log.info("processSheet parameter added ${erModRow.toString()}")
  }

  function getRecord(row : ERLRGParametersValuesRow) : ERLRGParametersValue_ACC {
    var erParamQuery = Query.make(ERLRGParametersValue_ACC)
        erParamQuery.compare(ERLRGParametersValue_ACC#ExperienceYear, Relop.Equals, row.ExperienceYear)
    var erParamCUQuery = erParamQuery.join(ERLRGParametersValue_ACC#ERParamLRG)
    erParamCUQuery.compare(ERParamLRG_ACC#LevyApplicationYear, Relop.Equals, row.levyYear)
    erParamCUQuery.compare(ERParamLRG_ACC#LRGCode, Relop.Equals, row.levyRiskGroupCode)
    var results = erParamQuery.select()
    _log.info("checkIfERParamValueExists ${row.toString()}")
    return results.FirstResult
  }

  function getParamLRG(row : ERLRGParametersValuesRow) : ERParamLRG_ACC {
    var erParamCUQuery = Query.make(ERParamLRG_ACC)
    erParamCUQuery.compare(ERParamLRG_ACC#LevyApplicationYear, Relop.Equals, row.levyYear)
    erParamCUQuery.compare(ERParamLRG_ACC#LRGCode, Relop.Equals, row.levyRiskGroupCode)
    return erParamCUQuery.select().AtMostOneRow
  }

  override property get SheetName() : String {
    return SHEET_NAME
  }
}