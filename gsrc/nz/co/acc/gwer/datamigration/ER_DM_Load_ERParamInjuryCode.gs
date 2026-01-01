package nz.co.acc.gwer.datamigration

uses nz.co.acc.common.integration.bulkupload.BulkUploadProcessUpdater
uses nz.co.acc.common.integration.bulkupload.AbstractBulkUploader
uses nz.co.acc.common.integration.bulkupload.csvprocessor.AbstractCSVProcessor
uses nz.co.acc.common.integration.bulkupload.csvprocessor.CSVProcessorResult
uses nz.co.acc.common.integration.bulkupload.csvrowparser.IRowParser
uses nz.co.acc.common.integration.bulkupload.error.RowProcessError
uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError
uses nz.co.acc.common.integration.bulkupload.fieldparser.IFieldParser
uses gw.surepath.suite.integration.logging.StructuredLogger
uses gw.pl.util.csv.CSVParser
uses edge.util.either.Either

uses java.util.concurrent.Executors
uses java.io.File

class ER_DM_Load_ERParamInjuryCode {

  public function MigrateERData(csvPath : String) {
    var executor = Executors.newWorkStealingPool(40)
    var inputFile = new File(csvPath+"ERParamInjuryCode.csv")
    var bulkUploader : ERParamInjuryCodeBulkUploader
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      bulkUploader = new ERParamInjuryCodeBulkUploader(inputFile, inputFile.Name, BulkUploadType_ACC.TC_ERDATAMIGRATION)
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

  class ERParamInjuryCodeBulkUploader extends AbstractBulkUploader {
    construct(uploadFile : File, uploadFileName : String, bulkUploadType : BulkUploadType_ACC) {
      super(uploadFile, uploadFileName, bulkUploadType)
    }
    override protected function getCSVProcessor(bulkUploadType : BulkUploadType_ACC, updater : BulkUploadProcessUpdater, uploadFile : File) : AbstractCSVProcessor {
      return new BulkERParamInjuryCodeProcessor(new ERParamInjuryCodeUploadParser(), updater, uploadFile)
    }
  }

  /*--- ER Data Objects ---*/
  class ERParamInjuryCodeUploadDTO {
    public var erID: Integer as ERID = null
    public var injuryCode: String as InjuryCode = null
    public var codingSystem: String as CodingSystem = null
    public var injuryDesc: String as InjuryDesc = null
    public var injuryCategory: String as InjuryCategory = null

    public override function toString(): String {
      return "ERParamInjuryCodeUploadDTO{" +
          "erID =" + ERID + '' +
          ", injuryCode ='" + injuryCode + '\'' +
          ", codingSystem ='" + codingSystem + '\'' +
          ", injuryDesc ='" + injuryDesc + '\'' +
          ", injuryCategory ='" + injuryCategory + '\'' +
          '}';
    }
  }

  /*--- ER Upload Parsers ---*/
  class ERParamInjuryCodeUploadParser implements IRowParser<ERParamInjuryCodeUploadDTO> {
    override function parseRow(csvParser : CSVParser) : Either<List<FieldValidationError>, ERParamInjuryCodeUploadDTO> {
      try {
        var erID = csvParser.nextString().trim().toOptional()
        var injuryCode = csvParser.nextString().trim().toOptional()
        var codingSystem = csvParser.nextString().trim().toOptional()
        var injuryDesc = csvParser.nextString().trim().toOptional()
        var injuryCategory = csvParser.nextString().trim().toOptional()

        var parseErrors = verifyPresenceOfMandatoryFields(injuryCode, codingSystem, injuryDesc, injuryCategory)
        var dto = new ERParamInjuryCodeUploadDTO()
        erID.each(\value -> {dto.ERID = Integer.valueOf(value)})
        injuryCode.each(\value -> {dto.InjuryCode = value})
        codingSystem.each(\value -> {dto.CodingSystem = value})
        injuryDesc.each(\value -> {dto.InjuryDesc = value})
        injuryCategory.each(\value -> {dto.InjuryCategory = value})

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
        injuryCode : Optional<String>,
        codingSystem : Optional<String>,
        injuryDesc : Optional<String>,
        injuryCategory : Optional<String>) : List<FieldValidationError> {
      var errors : LinkedList<FieldValidationError> = {}
      if (!injuryCode.isPresent())
        errors.add(new FieldValidationError("InjuryCode is required"))
      if (!codingSystem.isPresent())
        errors.add(new FieldValidationError("CodingSystem is required"))
      if (!injuryDesc.isPresent())
        errors.add(new FieldValidationError("InjuryDesc is required"))
      if (!injuryCategory.isPresent())
        errors.add(new FieldValidationError("InjuryCategory is required"))
      return errors
    }
  }

  /*--- ER Upload Processors ---*/
  class BulkERParamInjuryCodeProcessor extends AbstractCSVProcessor<ERParamInjuryCodeUploadDTO> {
    construct(rowParser : IRowParser<ERParamInjuryCodeUploadDTO>, updater : BulkUploadProcessUpdater, uploadFile : File) {
      super(rowParser, updater, uploadFile)
      _log = StructuredLogger.CONFIG.withClass(BulkERParamInjuryCodeProcessor)
    }

    override function processRows(rows : List<ERParamInjuryCodeUploadDTO>) : CSVProcessorResult {
      var dataRows = rows
      var rowProcessErrors = new ArrayList<RowProcessError>()
      _log.info("Importing ${dataRows.Count} ERParamInjuryCodes...")

      for (dataRow in dataRows index i) {
        var rowNumber = i + 1
        var lineNumber = i + 2
        createERParamInjuryCode(lineNumber, dataRow, rowProcessErrors)
      }
      return new CSVProcessorResult(dataRows.Count - rowProcessErrors.Count, rowProcessErrors)
    }

    private function createERParamInjuryCode(lineNumber : int, dto : ERParamInjuryCodeUploadDTO, rowProcessErrors : List<RowProcessError>) {
      try {
        var oEntity : ERParamInjuryCode_ACC
        gw.transaction.Transaction.runWithNewBundle(\bundle -> {
          oEntity = new ERParamInjuryCode_ACC()
          oEntity.PublicID = "er:"+dto.ERID
          oEntity.InjuryCode = dto.InjuryCode
          oEntity.CodingSystem = dto.CodingSystem
          oEntity.InjuryDesc = dto.InjuryDesc
          oEntity.InjuryCategory = dto.InjuryCategory
          _log.info("${lineNumber}: Created ER Parameters Claims Injury Code")
        }, "sys")
        onSuccess()
      } catch (e : Exception) {
        _log.info("${lineNumber}: Creation of ER Parameters Claims Injury Code failed for ${dto}: ${e.Message}")
        rowProcessErrors.add(new RowProcessError(lineNumber, e.Message))
        onFailure()
      }
    }
  }
}