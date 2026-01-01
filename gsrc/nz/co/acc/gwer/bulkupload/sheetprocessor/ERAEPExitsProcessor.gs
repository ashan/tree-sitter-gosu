package nz.co.acc.gwer.bulkupload.sheetprocessor

uses gw.api.locale.DisplayKey
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.integration.bulkupload.BulkUploadProcessUpdater
uses nz.co.acc.gwer.bulkupload.parser.IXLSCellParser
uses nz.co.acc.gwer.bulkupload.parser.IntegerXLSCellParser
uses nz.co.acc.gwer.bulkupload.parser.PolicyIDXLSCellParser
uses nz.co.acc.gwer.bulkupload.xlsprocessor.AbstractXLSSheetProcessor
uses org.apache.poi.ss.usermodel.Cell
uses org.apache.poi.ss.usermodel.Sheet

class ERAEPExitsProcessor extends AbstractXLSSheetProcessor {
  public static var SHEET_NAME : String = "AEP_Exits"
  private enum COLS {
    POLICY_ID("ACCNumber", new PolicyIDXLSCellParser()),
    LEVY_APP_YEAR("LevyAppYear", new IntegerXLSCellParser()),
    LAST("", null)
    private var _name: String;
    private var _parser : IXLSCellParser
    private construct(n: String, v: IXLSCellParser) {this._name = n; this._parser = v}
    property get name(): String {return this._name}
    property get parser(): IXLSCellParser {return this._parser}
  }
  construct(updater : BulkUploadProcessUpdater, sheet : Sheet) {
    super(updater, sheet)
    _log = StructuredLogger.CONFIG.withClass(this)
  }

  override property get SheetName() : String {
    return SHEET_NAME
  }

  override function validateHeaders(headers : List<String>) {
    _log.info(DisplayKey.get("Web.Experiencerating.BulkUpload.XLS.ColumnsHeadersValidationInfoMsg", SHEET_NAME) )
    if (headers.Count != COLS.LAST.Ordinal) {
      throw new RuntimeException(DisplayKey.get("Web.Experiencerating.BulkUpload.XLS.ColumnsHeadersValidationMismatchErrMsg1", headers.Count, COLS.LAST.Ordinal))
    }
    var enumHeaders = COLS.AllValues
    headers.eachWithIndex(\header, i -> {
      if (header != enumHeaders[i].name)
        throw new RuntimeException(DisplayKey.get("Web.Experiencerating.BulkUpload.XLS.ColumnsHeadersValidationMismatchErrMsg2", header, enumHeaders[i].name))
    })
  }

  override function processRow(list : List<Cell>) {
    var accNumber = COLS.POLICY_ID.parser.parse(list.get(COLS.POLICY_ID.Ordinal))
    if (accNumber.isLeft)
      throw new RuntimeException(accNumber.left.Message)

    var levyAppYear = COLS.LEVY_APP_YEAR.parser.parse(list.get(COLS.LEVY_APP_YEAR.Ordinal))
    if (levyAppYear.isLeft)
      throw new RuntimeException(levyAppYear.left.Message)

    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\b -> new ERAEPExits_ACC() {
      :ACCNumber = accNumber.right as String,
      :LevyApplicationYear = levyAppYear.right as Integer
    })
  }
}