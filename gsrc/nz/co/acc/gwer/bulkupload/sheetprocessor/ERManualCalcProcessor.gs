package nz.co.acc.gwer.bulkupload.sheetprocessor

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.integration.bulkupload.BulkUploadProcessUpdater
uses nz.co.acc.gwer.bulkupload.parser.ERParameterValueParser
uses nz.co.acc.gwer.bulkupload.row.ERManualCalcRow
uses nz.co.acc.gwer.bulkupload.xlsprocessor.AbstractXLSSheetProcessor
uses nz.co.acc.gwer.bulkupload.xlsprocessor.XLSProcessorResult
uses org.apache.poi.ss.usermodel.Cell
uses org.apache.poi.ss.usermodel.Sheet

/**
 * Processes a CSV file to update account statuses.
 * Created by HamblyAl on 18/03/2019.
 */
class ERManualCalcProcessor extends AbstractXLSSheetProcessor {
  public static var SHEET_NAME : String = "er_manual_calc"
  construct(updater : BulkUploadProcessUpdater, sheet : Sheet) {
    super(updater, sheet)
    _log = StructuredLogger.CONFIG.withClass(ERManualCalcProcessor)
  }

  public static function newInstance(
      updater : BulkUploadProcessUpdater,
      sheet : Sheet) : ERManualCalcProcessor {
    var parser = new ERParameterValueParser()
    return new ERManualCalcProcessor(updater, sheet)
  }

  function processRows(parsedRows : List<ERManualCalcRow>) : XLSProcessorResult {
    return null
  }

  private function createComment() : String {
    var comment = new StringBuilder()
    return comment.toString()
  }

  override property get SheetName() : String {
    return SHEET_NAME
  }

  override function processRow(list : List<Cell>) {
    var erRow = new ERManualCalcRow()
    erRow.levyApplicationYear = Integer.valueOf(list.get(0).StringCellValue)
    erRow.accPolicyID = list.get(1).StringCellValue
    erRow.reason = list.get(1).StringCellValue
    _log.info("processSheet ${erRow.toString()}")
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\b -> {
      var param = getRecord(erRow)

      if (param == null) {
        param = new ERParamManualCalc_ACC()
      } else {
        param = b.add(param)
      }

      param.LevyApplicationYear = erRow.LevyApplicationYear
      param.ACCPolicyID_ACC = erRow.ACCPolicyID
      param.Reason = erRow.Reason
    })
    _log.info("processSheet parameter added ${erRow.toString()}")
  }

  function getRecord(row : ERManualCalcRow) : ERParamManualCalc_ACC {
    var erParamQuery = Query.make(ERParamManualCalc_ACC)
        erParamQuery.compare(ERParamManualCalc_ACC#LevyApplicationYear, Relop.Equals, row.LevyApplicationYear)
        erParamQuery.compare(ERParamManualCalc_ACC#ACCPolicyID_ACC, Relop.Equals, row.ACCPolicyID)
    var results = erParamQuery.select()
    _log.info("checkIfERParamValueExists ${row.toString()}")
    return results.FirstResult
  }
}