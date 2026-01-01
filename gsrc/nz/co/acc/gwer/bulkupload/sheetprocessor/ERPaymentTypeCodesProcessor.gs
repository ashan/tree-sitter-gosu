package nz.co.acc.gwer.bulkupload.sheetprocessor

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.integration.bulkupload.BulkUploadProcessUpdater
uses nz.co.acc.gwer.bulkupload.error.XLSRowProcessError
uses nz.co.acc.gwer.bulkupload.parser.ERParameterValueParser
uses nz.co.acc.gwer.bulkupload.row.ERPaymentTypeCodesRow
uses nz.co.acc.gwer.bulkupload.xlsprocessor.AbstractXLSSheetProcessor
uses nz.co.acc.gwer.bulkupload.xlsprocessor.XLSProcessorResult
uses org.apache.poi.ss.usermodel.Cell
uses org.apache.poi.ss.usermodel.Sheet

/**
 * Processes a CSV file to update account statuses.
 * Created by HamblyAl on 18/03/2019.
 */
class ERPaymentTypeCodesProcessor extends AbstractXLSSheetProcessor {
  public static var SHEET_NAME : String = "er_payment_type_codes"
  construct(updater : BulkUploadProcessUpdater, sheet : Sheet) {
    super(updater, sheet)
    _log = StructuredLogger.CONFIG.withClass(ERPaymentTypeCodesProcessor)
  }

  public static function newInstance(
      updater : BulkUploadProcessUpdater,
      sheet : Sheet) : ERPaymentTypeCodesProcessor {
    var parser = new ERParameterValueParser()
    return new ERPaymentTypeCodesProcessor(updater, sheet)
  }

  function processRows(parsedRows : List<ERPaymentTypeCodesRow>) : XLSProcessorResult {
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
    var erRow = new ERPaymentTypeCodesRow()
    erRow.PaymentCode = list.get(0).StringCellValue
    erRow.PaymentDescription = list.get(1).StringCellValue
    erRow.LevyPaymentGroup = list.get(2).StringCellValue
    _log.info("processSheet ${erRow.toString()}")

    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\b -> {
      var param = getRecord(erRow)
      if(param == null) {
        param = new ERParamPaymentCode_ACC()
      } else {
        param = b.add(param)
      }

      param.PaymentCode = erRow.PaymentCode
      param.PaymentDesc = erRow.PaymentDescription
      param.LevyPaymentGroup = erRow.LevyPaymentGroup
    })
    _log.info("processSheet parameter added ${erRow.toString()}")
  }

  function getRecord(row : ERPaymentTypeCodesRow) : ERParamPaymentCode_ACC {
    var erParamQuery = Query.make(ERParamPaymentCode_ACC)
        erParamQuery.compare(ERParamPaymentCode_ACC#PaymentCode, Relop.Equals, row.PaymentCode)
    var results = erParamQuery.select()
    _log.info("checkIfERParamValueExists ${row.toString()}")
    return results.FirstResult
  }

  override property get SheetName() : String {
    return SHEET_NAME
  }
}