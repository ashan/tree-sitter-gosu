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
uses gw.surepath.suite.integration.logging.StructuredLogger
uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.pl.util.csv.CSVParser
uses edge.util.either.Either

uses java.util.concurrent.Executors
uses java.io.File

class ER_DM_Load_ERRunLevyPayer {

  public function MigrateERData(csvPath : String) {
    var executor = Executors.newWorkStealingPool(40)
    var inputFile = new File(csvPath+"ERRunLevyPayer.csv")
    var bulkUploader : ERRunLevyPayerBulkUploader
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      bulkUploader = new ERRunLevyPayerBulkUploader(inputFile, inputFile.Name, BulkUploadType_ACC.TC_ERDATAMIGRATION)
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

  class ERRunLevyPayerBulkUploader extends AbstractBulkUploader {
    construct(uploadFile : File, uploadFileName : String, bulkUploadType : BulkUploadType_ACC) {
      super(uploadFile, uploadFileName, bulkUploadType)
    }
    override protected function getCSVProcessor(bulkUploadType : BulkUploadType_ACC, updater : BulkUploadProcessUpdater, uploadFile : File) : AbstractCSVProcessor {
      return new BulkERRunLevyPayerProcessor(new ERRunLevyPayerUploadParser(), updater, uploadFile)
    }
  }

  /*--- ER Data Objects ---*/
  class ERRunLevyPayerUploadDTO {
    public var erID: Integer as ERID = null
    public var runID: Integer as RunID = null
    public var accPolicyID: String as ACCPolicyID = null
    public var businessGroupID: String as BusinessGroupID = null
    public var dSuffix: Integer as DSuffix = null
    public var sSuffix: Integer as SSuffix = null
    public var eSuffix: Integer as ESuffix = null
    public var calculationResultID: Integer as CalculationResultID = null
    public var programme: ERProgramme_ACC as ERProgramme = null
    public var erMod: Float as ERMod = null

    public override function toString(): String {
      return "ERRunLevyPayerUploadDTO{" +
          "erID =" + erID + '' +
          ", runID =" + runID + '' +
          ", accPolicyID =" + accPolicyID + '' +
          ", businessGroupID =" + businessGroupID + '' +
          ", dSuffix =" + dSuffix + '' +
          ", sSuffix =" + sSuffix + '' +
          ", eSuffix =" + eSuffix + '' +
          ", calculationResultID =" + calculationResultID + '' +
          ", programme =" + programme + '' +
          ", erMod =" + erMod + '' +
          '}';
    }
  }

  /*--- ER Upload Parsers ---*/
  class ERProgrammeParser implements IFieldParser<ERProgramme_ACC> {
    override function parse(text: String): Either<FieldValidationError, ERProgramme_ACC> {
      var oTypeItem = ERProgramme_ACC.get(text)
      if (oTypeItem == null) {
        return Either.left(new FieldValidationError("Invalid ER Programme: ${text}"))
      } else {
        return Either.right(oTypeItem)
      }
    }
  }

  class ERRunLevyPayerUploadParser implements IRowParser<ERRunLevyPayerUploadDTO> {
    private final var dateParser = new DateParser()
    private final var erProgrammeParser = new ERProgrammeParser()

    override function parseRow(csvParser : CSVParser) : Either<List<FieldValidationError>, ERRunLevyPayerUploadDTO> {
      try {
        var erID = csvParser.nextString().trim().toOptional()
        var runID = csvParser.nextString().trim().toOptional()
        var accPolicyID = csvParser.nextString().trim().toOptional()
        var businessGroupID = csvParser.nextString().trim().toOptional()
        var dSuffix = csvParser.nextString().trim().toOptional()
        var sSuffix = csvParser.nextString().trim().toOptional()
        var eSuffix = csvParser.nextString().trim().toOptional()
        var calculationResultID = csvParser.nextString().trim().toOptional()
        var programme = csvParser.nextString().trim().toOptional()
        var erMod = csvParser.nextString().trim().toOptional()

        var parseErrors = verifyPresenceOfMandatoryFields(runID, accPolicyID)
        var dto = new ERRunLevyPayerUploadDTO()
        erID.each(\value -> {dto.ERID = Integer.valueOf(value)})
        runID.each(\value -> {dto.RunID = Integer.valueOf(value)})
        accPolicyID.each(\value -> {dto.ACCPolicyID = value})
        businessGroupID.each(\value -> {dto.BusinessGroupID = value})
        dSuffix.each(\value -> {dto.DSuffix = Integer.valueOf(value)})
        sSuffix.each(\value -> {dto.SSuffix = Integer.valueOf(value)})
        eSuffix.each(\value -> {dto.ESuffix = Integer.valueOf(value)})
        calculationResultID.each(\value -> {dto.CalculationResultID = Integer.valueOf(value)})
        parseField(parseErrors, erProgrammeParser, programme,
            \parsedResult -> {
              dto.ERProgramme = parsedResult
            })
        erMod.each(\value -> {dto.ERMod = Float.valueOf(value)})

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
        runID : Optional<String>,
        accPolicyID : Optional<String>) : List<FieldValidationError> {
      var errors : LinkedList<FieldValidationError> = {}
      if (!runID.isPresent())
        errors.add(new FieldValidationError("RequestID is required"))
      if (!accPolicyID.isPresent())
        errors.add(new FieldValidationError("ACCPolicyID is required"))
      return errors
    }
  }

  /*--- ER Upload Processors ---*/
  class BulkERRunLevyPayerProcessor extends AbstractCSVProcessor<ERRunLevyPayerUploadDTO> {
    construct(rowParser : IRowParser<ERRunLevyPayerUploadDTO>, updater : BulkUploadProcessUpdater, uploadFile : File) {
      super(rowParser, updater, uploadFile)
      _log = StructuredLogger.CONFIG.withClass(BulkERRunLevyPayerProcessor)
    }

    override function processRows(rows : List<ERRunLevyPayerUploadDTO>) : CSVProcessorResult {
      var dataRows = rows
      var rowProcessErrors = new ArrayList<RowProcessError>()
      _log.info("Importing ${dataRows.Count} ERRunLevyPayers...")

      for (dataRow in dataRows index i) {
        var rowNumber = i + 1
        var lineNumber = i + 2
        createERRunLevyPayer(lineNumber, dataRow, rowProcessErrors)
      }
      return new CSVProcessorResult(dataRows.Count - rowProcessErrors.Count, rowProcessErrors)
    }

    private function createERRunLevyPayer(lineNumber : int, dto : ERRunLevyPayerUploadDTO, rowProcessErrors : List<RowProcessError>) {
      try {
        var oEntity : ERRunLevyPayer_ACC
        gw.transaction.Transaction.runWithNewBundle(\bundle -> {
          oEntity = new ERRunLevyPayer_ACC()
          oEntity.PublicID = "er:"+dto.ERID
          if(dto.RunID != null) {
            var oERRun = getERRun("er:" + dto.RunID)
            if(oERRun != null)
              oEntity.ERRun = oERRun
          }
          oEntity.ACCPolicyID_ACC = dto.ACCPolicyID
          if(dto.BusinessGroupID != null) {
            var oERBusinessGroup = getERBusinessGroup("er:" + dto.BusinessGroupID)
            if(oERBusinessGroup != null)
              oEntity.ERBusinessGroup = oERBusinessGroup
          }
          oEntity.DSuffix = dto.DSuffix
          oEntity.SSuffix = dto.SSuffix
          oEntity.ESuffix = dto.ESuffix
          if(dto.CalculationResultID != null) {
            var oERRunCalcResult = getERRunCalcResult("er:" + dto.CalculationResultID)
            if(oERRunCalcResult != null) {
              oEntity.ERRunCalcResult = oERRunCalcResult
              oEntity.ERProgramme = oERRunCalcResult.ERProgramme
              oEntity.ERMod = oERRunCalcResult.ERMod
            }
          }
          _log.info("${lineNumber}: Created ER Run Levy Payer")
        }, "sys")
        onSuccess()
      } catch (e : Exception) {
        _log.info("${lineNumber}: Creation of ER Run Levy Payer failed for ${dto}: ${e.Message}")
        rowProcessErrors.add(new RowProcessError(lineNumber, e.Message))
        onFailure()
      }
    }
    private function getERRun(publicID : String) : ERRun_ACC {
      return Query.make(ERRun_ACC)
          .compareIgnoreCase(ERRun_ACC#PublicID, Relop.Equals, publicID)
          .select().AtMostOneRow
    }
    private function getERBusinessGroup(businessGroupID : String) : ERBusinessGroup_ACC {
      return Query.make(ERBusinessGroup_ACC)
          .compareIgnoreCase(ERBusinessGroup_ACC#BusinessGroupID, Relop.Equals, businessGroupID)
          .select().AtMostOneRow
    }
    private function getERRunCalcResult(publicID : String) : ERRunCalcResult_ACC {
      return Query.make(ERRunCalcResult_ACC)
          .compareIgnoreCase(ERRunCalcResult_ACC#PublicID, Relop.Equals, publicID)
          .select().AtMostOneRow
    }
  }
}