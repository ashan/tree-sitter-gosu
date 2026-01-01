package nz.co.acc.gwer.upload.processor

uses gw.surepath.suite.integration.logging.StructuredLogger_ACC
uses nz.co.acc.common.integration.bulkupload.BulkUploadProcessUpdater
uses nz.co.acc.common.integration.bulkupload.csvprocessor.AbstractCSVProcessor
uses nz.co.acc.common.integration.bulkupload.csvprocessor.CSVProcessorResult
uses nz.co.acc.common.integration.bulkupload.csvrowparser.IRowParser
uses nz.co.acc.common.integration.bulkupload.error.RowProcessError
uses nz.co.acc.gwer.upload.dto.ERClaimLiableEmployerUploadDTO
uses nz.co.acc.gwer.util.ERProcessUtils_ACC
uses gw.api.database.Query
uses gw.api.database.Relop
uses java.io.File

/*--- ER Upload Processors ---*/
class BulkERClaimLiableEmployerProcessor extends AbstractCSVProcessor<ERClaimLiableEmployerUploadDTO> {
  var _erProcessUtils : ERProcessUtils_ACC

  construct() {
    init()
  }

  construct(rowParser : IRowParser<ERClaimLiableEmployerUploadDTO>, updater : BulkUploadProcessUpdater, uploadFile : File) {
    super(rowParser, updater, uploadFile)
    init()
  }

  function init() {
    _log = StructuredLogger_ACC.CONFIG.withClass(BulkERClaimLiableEmployerProcessor)
    _erProcessUtils = new ERProcessUtils_ACC()
  }

  override function processRows(rows : List<ERClaimLiableEmployerUploadDTO>) : CSVProcessorResult {
    var dataRows = rows
    var rowProcessErrors = new ArrayList<RowProcessError>()
    _log.info("Importing ${dataRows.Count} ERClaimLiableEmployer...")

    for (dataRow in dataRows index i) {
      var rowNumber = i + 1
      var lineNumber = i + 2
      processDTO(lineNumber, dataRow, rowProcessErrors)
    }
    return new CSVProcessorResult(dataRows.Count - rowProcessErrors.Count, rowProcessErrors)
  }

  public function processDTO(lineNumber : int, dto : ERClaimLiableEmployerUploadDTO, rowProcessErrors : List<RowProcessError>) {
    try {
      createOrUpdateClaimRecord(lineNumber, dto)
      onSuccess()
    } catch(e:Exception) {
      _log.info("${lineNumber}: Creation of ER Claim Liable Employer failed for ${dto}: ${e.Message}")
      rowProcessErrors.add(new RowProcessError(lineNumber, e.Message))
      onFailure()
    }
  }

  function createOrUpdateClaimRecord(lineNumber : int, dto : ERClaimLiableEmployerUploadDTO) {
    var oERParamCU : ERParamCU_ACC
    if (dto.ClaimCUCode != null) {
      oERParamCU = _erProcessUtils.getERParamCU(dto.ClaimCUCode, dto.ExperienceYear)
    }
    var encryptedClaimantName = _erProcessUtils.encrypt(dto.ClaimantName)
    var erClaimLiableEmployer = getERClaimLiableEmployer(dto.ClaimNumber, dto.ACCPolicyID_ACC, oERParamCU)

    gw.transaction.Transaction.runWithNewBundle(\bundle -> {
      var oEntity : ERClaimLiableEmployer_ACC
      if(erClaimLiableEmployer == null) {
        oEntity = new ERClaimLiableEmployer_ACC()
        oEntity.ClaimNumber = dto.ClaimNumber
        oEntity.ACCPolicyID_ACC = dto.ACCPolicyID_ACC
        if (oERParamCU != null) {
          oEntity.ClaimERParamCU = oERParamCU
        }
      } else {
        oEntity = bundle.add(erClaimLiableEmployer)
      }

      oEntity.ClaimantACCNumber = dto.ClaimantACCNumber
      oEntity.ClaimantName = _erProcessUtils.encrypt(dto.ClaimantName)
      oEntity.InjuryDate = dto.InjuryDate
      oEntity.ClaimFundCode = dto.ClaimFundCode
      oEntity.ClaimFundDesc = dto.ClaimFundDesc
      oEntity.AcceptedDate = dto.AcceptedDate
      oEntity.ClaimDesc = dto.ClaimDesc
      oEntity.AccidentLocation = dto.AccidentLocation
      oEntity.CoverDecision = dto.CoverDecision
      oEntity.IsSensitive = dto.IsSensitive
      oEntity.IsFatal = dto.IsFatal
      oEntity.IsGradualProcess = dto.IsGradualProcess
      oEntity.IsAdverse = dto.IsAdverse
      oEntity.ExperienceYear = dto.ExperienceYear
      oEntity.GreatestModifiedDate = dto.GreatestModifiedDate
      oEntity.CntExpInjury = dto.CntExpInjury
      oEntity.PrimaryCodingSystem = dto.PrimaryCodingSystem
      oEntity.PrimaryInjuryCode = dto.PrimaryInjuryCode
      oEntity.PrimaryInjuryDesc = dto.PrimaryInjuryDesc
      oEntity.PercentLiable = dto.PercentLiable
      oEntity.TotalWCD_Yr1 = dto.TotalWCD_Yr1
      oEntity.TotalWCD_Yr2 = dto.TotalWCD_Yr2
      oEntity.TotalWCD_Yr3 = dto.TotalWCD_Yr3
      oEntity.MedicalSpend_Yr1 = dto.MedicalSpend_Yr1
      oEntity.MedicalSpend_Yr2 = dto.MedicalSpend_Yr2
      oEntity.MedicalSpend_Yr3 = dto.MedicalSpend_Yr3
      _log.info("${lineNumber}: Update ER Claim Liable Employer")
    }, "sys")
  }

  private function getERClaimLiableEmployer(claimNumber : String, accPolicyID : String, claimERParamCU : ERParamCU_ACC) : ERClaimLiableEmployer_ACC {
    return Query.make(ERClaimLiableEmployer_ACC)
        .compare(ERClaimLiableEmployer_ACC#ClaimNumber, Relop.Equals, claimNumber)
        .compare(ERClaimLiableEmployer_ACC#ACCPolicyID_ACC, Relop.Equals, accPolicyID)
        .compare(ERClaimLiableEmployer_ACC#ClaimERParamCU, Relop.Equals, claimERParamCU)
        .select().FirstResult
  }
}