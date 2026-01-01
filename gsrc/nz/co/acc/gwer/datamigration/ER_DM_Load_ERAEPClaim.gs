package nz.co.acc.gwer.datamigration

uses nz.co.acc.common.integration.bulkupload.BulkUploadProcessUpdater
uses nz.co.acc.common.integration.bulkupload.AbstractBulkUploader
uses nz.co.acc.common.integration.bulkupload.csvprocessor.AbstractCSVProcessor
uses nz.co.acc.common.integration.bulkupload.csvprocessor.CSVProcessorResult
uses nz.co.acc.common.integration.bulkupload.csvrowparser.IRowParser
uses nz.co.acc.common.integration.bulkupload.error.RowProcessError
uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError
uses nz.co.acc.common.integration.bulkupload.fieldparser.DateParser
uses nz.co.acc.common.integration.bulkupload.fieldparser.IFieldParser
uses nz.co.acc.gwer.util.ERProcessUtils_ACC
uses gw.surepath.suite.integration.logging.StructuredLogger
uses gw.pl.util.csv.CSVParser
uses edge.util.either.Either
uses java.math.BigDecimal
uses java.util.concurrent.Executors
uses java.io.File

class ER_DM_Load_ERAEPClaim {
  private static var _erProcessUtils = new ERProcessUtils_ACC()

  public function MigrateERData(csvPath : String) {
    var executor = Executors.newWorkStealingPool(40)
    var inputFile = new File(csvPath+"ERAEPClaim.csv")
    var bulkUploader : ERAEPClaimBulkUploader
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      bulkUploader = new ERAEPClaimBulkUploader(inputFile, inputFile.Name, BulkUploadType_ACC.TC_ERDATAMIGRATION)
    })
    try {
      executor.submit(\-> bulkUploader.run())
    } catch (e : Exception) {
      print("Bulk uploader can not be scheduled for execution: "+e)
    }

    //shutdown ExecutorService
    executor.shutdown();
    while (!executor.isTerminated()) {   }
    System.out.println("Finished all ERBusinessGroup threads");
  }

  class ERAEPClaimBulkUploader extends AbstractBulkUploader {
    construct(uploadFile : File, uploadFileName : String, bulkUploadType : BulkUploadType_ACC) {
      super(uploadFile, uploadFileName, bulkUploadType)
    }
    override protected function getCSVProcessor(bulkUploadType : BulkUploadType_ACC, updater : BulkUploadProcessUpdater, uploadFile : File) : AbstractCSVProcessor {
      return new BulkERAEPClaimProcessor(new ERAEPClaimUploadParser(), updater, uploadFile)
    }
  }

  /*--- ER Data Objects ---*/
  class ERAEPClaimUploadDTO {
    public var erID: Integer as ERID = null
    public var accPolicyID_ACC: String as ACCPolicyID_ACC = null
    public var levyApplicationYear: Integer as LevyApplicationYear = null
    public var claimNumber: String as ClaimNumber = null
    public var claimCUCode: String as ClaimCUCode = null
    public var experienceYear: Integer as ExperienceYear = null
    public var injuryDate: Date as InjuryDate = null
    public var isFatal: Integer as IsFatal = null
    public var isGradualProcess: Integer as IsGradualProcess = null
    public var isSensitive: Integer as IsSensitive = null
    public var uncappedWCD: BigDecimal as UncappedWCD = null
    public var cappedWCD: BigDecimal as CappedWCD = null
    public var medicalSpend: BigDecimal as MedicalSpend = null

    public override function toString(): String {
      return "ERAEPClaimUploadDTO{" +
          "erID ='" + ERID + '\'' +
          ", accPolicyID_ACC ='" + accPolicyID_ACC + '\'' +
          ", levyApplicationYear =" + levyApplicationYear + '' +
          ", claimNumber ='" + claimNumber + '\'' +
          ", claimCUCode ='" + claimCUCode + '\'' +
          ", experienceYear =" + experienceYear + '' +
          ", injuryDate ='" + injuryDate + '\'' +
          ", isFatal =" + isFatal + '' +
          ", isGradualProcess =" + isGradualProcess + '' +
          ", isSensitive =" + isSensitive + '' +
          ", uncappedWCD =" + uncappedWCD + '' +
          ", cappedWCD =" + cappedWCD + '' +
          ", medicalSpend =" + medicalSpend + '' +
          '}';
    }
  }

  /*--- ER Upload Parsers ---*/
  class ERAEPClaimUploadParser implements IRowParser<ERAEPClaimUploadDTO> {
    private final var dateParser = new DateParser()

    override function parseRow(csvParser : CSVParser) : Either<List<FieldValidationError>, ERAEPClaimUploadDTO> {
      try {
        var erID = csvParser.nextString().trim().toOptional()
        var accPolicyID_ACC = csvParser.nextString().trim().toOptional()
        var levyApplicationYear = csvParser.nextString().trim().toOptional()
        var claimNumber = csvParser.nextString().trim().toOptional()
        var claimCUCode = csvParser.nextString().trim().toOptional()
        var experienceYear = csvParser.nextString().trim().toOptional()
        var injuryDate = csvParser.nextString().trim().toOptional()
        var isFatal = csvParser.nextString().trim().toOptional()
        var isGradualProcess = csvParser.nextString().trim().toOptional()
        var isSensitive = csvParser.nextString().trim().toOptional()
        var uncappedWCD = csvParser.nextString().trim().toOptional()
        var cappedWCD = csvParser.nextString().trim().toOptional()
        var medicalSpend = csvParser.nextString().trim().toOptional()

        var parseErrors = verifyPresenceOfMandatoryFields(claimNumber, levyApplicationYear)
        var dto = new ERAEPClaimUploadDTO()
        erID.each(\value -> {dto.ERID = Integer.valueOf(value)})
        accPolicyID_ACC.each(\value -> {dto.ACCPolicyID_ACC = value})
        levyApplicationYear.each(\value -> {dto.LevyApplicationYear = Integer.valueOf(value)})
        claimNumber.each(\value -> {dto.ClaimNumber = value})
        claimCUCode.each(\value -> {dto.ClaimCUCode = value})
        experienceYear.each(\value -> {dto.ExperienceYear = Integer.valueOf(value)})
        parseField(parseErrors, dateParser, injuryDate, \parsedResult -> {
          dto.InjuryDate = parsedResult
        })
        isFatal.each(\value -> {dto.IsFatal = Integer.valueOf(value)})
        isGradualProcess.each(\value -> {dto.IsGradualProcess = Integer.valueOf(value)})
        isSensitive.each(\value -> {dto.IsSensitive = Integer.valueOf(value)})
        uncappedWCD.each(\value -> {dto.UncappedWCD = new BigDecimal(value)})
        cappedWCD.each(\value -> {dto.CappedWCD = new BigDecimal(value)})
        medicalSpend.each(\value -> {dto.MedicalSpend = new BigDecimal(value)})

        if (parseErrors.HasElements) {
          return Either.left(parseErrors)
        } else {
          return Either.right(dto)
        }
      } catch (e : NoSuchElementException) {
        return Either.left({new FieldValidationError("This row has missing fields. Check that you selected the correct Upload Type.")})
      } catch (e : Exception) {
        return Either.left({new FieldValidationError(e.toString())})
      }
    }

    /** Generic function to parse a single CSV field **/
    function parseField<FieldType>(
        fieldValidationErrors : List<FieldValidationError>,
        fieldParser : IFieldParser<FieldType>,
        csvInput : Optional<String>,
        fieldSetter(fieldValue : FieldType) : void) {

      if (csvInput.isPresent()) {
        var parseResult = fieldParser.parse(csvInput.get())
        if (parseResult.isLeft) {
          fieldValidationErrors.add(parseResult.left)
        } else {
          fieldSetter(parseResult.right)
        }
      }
    }

    private function verifyPresenceOfMandatoryFields(
        accPolicyID_ACC : Optional<String>,
        levyApplicationYear : Optional<String>) : List<FieldValidationError> {

      var errors : LinkedList<FieldValidationError> = {}

      if (!accPolicyID_ACC.isPresent()) {
        errors.add(new FieldValidationError("ACCPolicyID_ACC is required"))
      }
      if (!levyApplicationYear.isPresent()) {
        errors.add(new FieldValidationError("LevyApplicationYear is required"))
      }
      return errors
    }
  }

  /*--- ER Upload Processors ---*/
  class BulkERAEPClaimProcessor extends AbstractCSVProcessor<ERAEPClaimUploadDTO> {
    construct(rowParser : IRowParser<ERAEPClaimUploadDTO>, updater : BulkUploadProcessUpdater, uploadFile : File) {
      super(rowParser, updater, uploadFile)
      _log = StructuredLogger.CONFIG.withClass(BulkERAEPClaimProcessor)
    }

    override function processRows(rows : List<ERAEPClaimUploadDTO>) : CSVProcessorResult {
      var ERAEPClaims = rows
      var rowProcessErrors = new ArrayList<RowProcessError>()
      _log.info("Importing ${ERAEPClaims.Count} ERAEPClaims...")

      for (ERAEPClaim in ERAEPClaims index i) {
        var rowNumber = i + 1
        var lineNumber = i + 2
        createERAEPClaim(lineNumber, ERAEPClaim, rowProcessErrors)
      }
      return new CSVProcessorResult(ERAEPClaims.Count - rowProcessErrors.Count, rowProcessErrors)
    }

    private function createERAEPClaim(lineNumber : int, dto : ERAEPClaimUploadDTO, rowProcessErrors : List<RowProcessError>) {
      try {
        var oERParamCU : ERParamCU_ACC
        if (dto.ClaimCUCode != null) {
          oERParamCU = _erProcessUtils.getERParamCU(dto.ClaimCUCode, dto.ExperienceYear)
        }
        var oEntity : ERAEPClaims_ACC
        gw.transaction.Transaction.runWithNewBundle(\bundle -> {
          oEntity = new ERAEPClaims_ACC()
          oEntity.PublicID = "er:"+dto.ERID
          oEntity.ACCPolicyID_ACC = dto.ACCPolicyID_ACC
          oEntity.LevyApplicationYear = dto.LevyApplicationYear
          oEntity.ClaimNumber = dto.ClaimNumber
          if (oERParamCU != null)
              oEntity.ERParamCU = oERParamCU
          oEntity.ExperienceYear = dto.ExperienceYear
          oEntity.InjuryDate = dto.InjuryDate
          oEntity.IsFatal = dto.IsFatal
          oEntity.IsGradualProcess = dto.IsGradualProcess
          oEntity.IsSensitive = dto.IsSensitive
          oEntity.UncappedWCD = dto.UncappedWCD
          oEntity.CappedWCD = dto.CappedWCD
          oEntity.MedicalSpend = dto.MedicalSpend
          _log.info("${lineNumber}: Created ER AEP Claim")
        }, "sys")
        onSuccess()
      } catch (e : Exception) {
        _log.info("${lineNumber}: Creation of ER AEP Claim failed for ${dto}: ${e.Message}")
        rowProcessErrors.add(new RowProcessError(lineNumber, e.Message))
        onFailure()
      }
    }
  }
}