package nz.co.acc.gwer.bulkupload.sheetprocessor

uses gw.api.locale.DisplayKey
uses gw.surepath.suite.integration.logging.StructuredLogger_ACC
uses nz.co.acc.common.integration.bulkupload.BulkUploadProcessUpdater
uses nz.co.acc.gwer.bulkupload.parser.BoolXLSCellParser
uses nz.co.acc.gwer.bulkupload.parser.DateXLSCellParser
uses nz.co.acc.gwer.bulkupload.parser.IXLSCellParser
uses nz.co.acc.gwer.bulkupload.parser.IntegerXLSCellParser
uses nz.co.acc.gwer.bulkupload.parser.NumericXLSCellParser
uses nz.co.acc.gwer.bulkupload.parser.PolicyIDXLSCellParser
uses nz.co.acc.gwer.bulkupload.xlsprocessor.AbstractXLSSheetProcessor
uses nz.co.acc.gwer.util.ERProcessUtils_ACC
uses org.apache.poi.ss.usermodel.Cell
uses org.apache.poi.ss.usermodel.CellType
uses org.apache.poi.ss.usermodel.Sheet

class ERAEPClaimsProcessor extends AbstractXLSSheetProcessor {
  private static var _erProcessUtils = new ERProcessUtils_ACC()
  public static var SHEET_NAME: String = "AEP_Claims"
  private enum COLS {
    POLICY_ID("LiableEmployerACCNumber", new PolicyIDXLSCellParser()),
    CU_CODE("CUCode", new NumericXLSCellParser()),
    CLAIM_NUMBER("ClaimNumber", null),
    IS_SENSITIVE("IsSensitive", new BoolXLSCellParser()),
    IS_FATAL("IsFatal", new BoolXLSCellParser()),
    IS_GRADUAL_PROCESS("IsGradualProcess", new BoolXLSCellParser()),
    INJURY_DATE("InjuryDate", new DateXLSCellParser()),
    UNCAPPED_WCD("UncappedWCD", new NumericXLSCellParser()),
    CAPPED_WCD("CappedWCD", new NumericXLSCellParser()),
    EXPERIENCE_YEAR("ExperienceYear", new IntegerXLSCellParser()),
    MEDICAL_SPEND("MedicalSpend", new NumericXLSCellParser()),
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
    _log = StructuredLogger_ACC.CONFIG.withClass(this)
  }

  override property get SheetName() : String {
    return SHEET_NAME
  }

  override function processRow(list : List<Cell>) {

    var liableEmployerACCNumber = COLS.POLICY_ID.parser.parse(list.get(COLS.POLICY_ID.Ordinal))
    if (liableEmployerACCNumber.isLeft)
      throw new RuntimeException(liableEmployerACCNumber.left.Message)

    var cuCode = COLS.CU_CODE.parser.parse(list.get(COLS.CU_CODE.Ordinal))
    if (cuCode.isLeft)
      throw new RuntimeException(cuCode.left.Message)

    var claimNumberCell = list.get(COLS.CLAIM_NUMBER.Ordinal)
//    claimNumberCell.CellType = CellType.STRING
    var claimNumber = claimNumberCell.StringCellValue
    if (!claimNumber.HasContent)
      throw new RuntimeException("Claim Number is null")

    var isSensitive = COLS.IS_SENSITIVE.parser.parse(list.get(COLS.IS_SENSITIVE.Ordinal))
    if (isSensitive.isLeft)
      throw new RuntimeException(isSensitive.left.Message)

    var isFatal = COLS.IS_FATAL.parser.parse(list.get(COLS.IS_FATAL.Ordinal))
    if (isFatal.isLeft)
      throw new RuntimeException(isFatal.left.Message)

    var IsGradualProcess = COLS.IS_GRADUAL_PROCESS.parser.parse(list.get(COLS.IS_GRADUAL_PROCESS.Ordinal))
    if (IsGradualProcess.isLeft)
      throw new RuntimeException(IsGradualProcess.left.Message)

    var injutyDate = COLS.INJURY_DATE.parser.parse(list.get(COLS.INJURY_DATE.Ordinal))
    if (injutyDate.isLeft)
      throw new RuntimeException(injutyDate.left.Message)

    var uncappedWCD = COLS.UNCAPPED_WCD.parser.parse(list.get(COLS.UNCAPPED_WCD.Ordinal))
    if (uncappedWCD.isLeft)
      throw new RuntimeException(uncappedWCD.left.Message)

    var cappedWCD = COLS.CAPPED_WCD.parser.parse(list.get(COLS.CAPPED_WCD.Ordinal))
    if (cappedWCD.isLeft)
      throw new RuntimeException(cappedWCD.left.Message)

    var experienceYear = COLS.EXPERIENCE_YEAR.parser.parse(list.get(COLS.EXPERIENCE_YEAR.Ordinal))
    if (experienceYear.isLeft)
      throw new RuntimeException(experienceYear.left.Message)

    var medicalSpend = COLS.MEDICAL_SPEND.parser.parse(list.get(COLS.MEDICAL_SPEND.Ordinal))
    if (medicalSpend.isLeft)
      throw new RuntimeException(medicalSpend.left.Message)

    var levyAppYear = COLS.LEVY_APP_YEAR.parser.parse(list.get(COLS.LEVY_APP_YEAR.Ordinal))
    if (levyAppYear.isLeft)
      throw new RuntimeException(levyAppYear.left.Message)

    var oERParamCU = _erProcessUtils.getERParamCU(cuCode.right as String, experienceYear.right as Integer)
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\b -> new ERAEPClaims_ACC() {
      :ACCPolicyID_ACC = liableEmployerACCNumber.right as String,
      :ERParamCU = oERParamCU as ERParamCU_ACC,
      :ClaimNumber = claimNumber,
      :IsSensitive = isSensitive.right as Integer,
      :IsFatal = isFatal.right as Integer,
      :IsGradualProcess = IsGradualProcess.right as Integer,
      :InjuryDate = injutyDate.right as Date,
      :UncappedWCD = uncappedWCD.right as Double,
      :CappedWCD = cappedWCD.right as Double,
      :ExperienceYear = experienceYear.right as Integer,
      :MedicalSpend = medicalSpend.right as Double,
      :LevyApplicationYear = levyAppYear.right as Integer
    })
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
}