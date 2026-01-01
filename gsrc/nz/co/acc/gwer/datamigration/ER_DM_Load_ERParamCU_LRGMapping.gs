package nz.co.acc.gwer.datamigration

uses nz.co.acc.common.integration.bulkupload.BulkUploadProcessUpdater
uses nz.co.acc.common.integration.bulkupload.AbstractBulkUploader
uses nz.co.acc.common.integration.bulkupload.csvprocessor.AbstractCSVProcessor
uses nz.co.acc.common.integration.bulkupload.csvprocessor.CSVProcessorResult
uses nz.co.acc.common.integration.bulkupload.csvrowparser.IRowParser
uses nz.co.acc.common.integration.bulkupload.error.RowProcessError
uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError
uses nz.co.acc.common.integration.bulkupload.fieldparser.IFieldParser
uses nz.co.acc.gwer.util.ERProcessUtils_ACC
uses gw.surepath.suite.integration.logging.StructuredLogger
uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.pl.util.csv.CSVParser
uses edge.util.either.Either
uses java.util.concurrent.Executors
uses java.io.File

class ER_DM_Load_ERParamCU_LRGMapping {
  private static var _erProcessUtils = new ERProcessUtils_ACC()

  public function MigrateERData(csvPath : String) {
    var executor = Executors.newWorkStealingPool(40)
    var inputFile = new File(csvPath+"ERParamCU_LRGMapping.csv")
    var bulkUploader : ERParamCU_LRGMappingBulkUploader
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      bulkUploader = new ERParamCU_LRGMappingBulkUploader(inputFile, inputFile.Name, BulkUploadType_ACC.TC_ERDATAMIGRATION)
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

  class ERParamCU_LRGMappingBulkUploader extends AbstractBulkUploader {
    construct(uploadFile : File, uploadFileName : String, bulkUploadType : BulkUploadType_ACC) {
      super(uploadFile, uploadFileName, bulkUploadType)
    }
    override protected function getCSVProcessor(bulkUploadType : BulkUploadType_ACC, updater : BulkUploadProcessUpdater, uploadFile : File) : AbstractCSVProcessor {
      return new BulkERParamCU_LRGMappingProcessor(new ERParamCU_LRGMappingUploadParser(), updater, uploadFile)
    }
  }

  /*--- ER Data Objects ---*/
  class ERParamCU_LRGMappingUploadDTO {
    public var erID: Integer as ERID = null
    public var levyApplicationYear: Integer as LevyApplicationYear = null
    public var levyYear: Integer as LevyYear = null
    public var lrgCode: Integer as LRGCode = null
    public var cuCode: String as CUCode = null
    public var isActive: Boolean as IsActive = null

    public override function toString(): String {
      return "ERParamCU_LRGMappingUploadDTO{" +
          "erID ='" + ERID + '\'' +
          ", levyApplicationYear ='" + levyApplicationYear + '\'' +
          ", levyYear ='" + levyYear + '\'' +
          ", lrgCode ='" + lrgCode + '\'' +
          ", cuCode ='" + cuCode + '\'' +
          ", isActive ='" + isActive + '\'' +
          '}';
    }
  }

  /*--- ER Upload Parsers ---*/
  class ERParamCU_LRGMappingUploadParser implements IRowParser<ERParamCU_LRGMappingUploadDTO> {
    override function parseRow(csvParser : CSVParser) : Either<List<FieldValidationError>, ERParamCU_LRGMappingUploadDTO> {
      try {
        var erID = csvParser.nextString().trim().toOptional()
        var levyApplicationYear = csvParser.nextString().trim().toOptional()
        var levyYear = csvParser.nextString().trim().toOptional()
        var lrgCode = csvParser.nextString().trim().toOptional()
        var cuCode = csvParser.nextString().trim().toOptional()
        var isActive = csvParser.nextString().trim().toOptional()

        var parseErrors = verifyPresenceOfMandatoryFields(levyApplicationYear, levyYear, lrgCode, cuCode, isActive)
        var dto = new ERParamCU_LRGMappingUploadDTO()
        erID.each(\value -> {dto.ERID = Integer.valueOf(value)})
        levyApplicationYear.each(\value -> {dto.LevyApplicationYear = Integer.valueOf(value)})
        levyYear.each(\value -> {dto.LevyYear = Integer.valueOf(value)})
        lrgCode.each(\value -> {dto.LRGCode = Integer.valueOf(value)})
        cuCode.each(\value -> {dto.CUCode = value})
        isActive.each(\value -> {
          if(Integer.valueOf(value)==1) {
            dto.IsActive = Boolean.TRUE
          } else {
            dto.IsActive = Boolean.FALSE
          }
        })

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
        levyApplicationYear : Optional<String>,
        levyYear : Optional<String>,
        lrgCode : Optional<String>,
        cuCode : Optional<String>,
        isActive : Optional<String>) : List<FieldValidationError> {

      var errors : LinkedList<FieldValidationError> = {}

      if (!levyApplicationYear.isPresent())
        errors.add(new FieldValidationError("LevyApplicationYear is required"))
      if (!levyYear.isPresent())
        errors.add(new FieldValidationError("LevyYear is required"))
      if (!lrgCode.isPresent())
        errors.add(new FieldValidationError("LRGCode is required"))
      if (!cuCode.isPresent())
        errors.add(new FieldValidationError("CUCode is required"))
      if (!isActive.isPresent())
        errors.add(new FieldValidationError("IsActive is required"))
      return errors
    }
  }

  /*--- ER Upload Processors ---*/
  class BulkERParamCU_LRGMappingProcessor extends AbstractCSVProcessor<ERParamCU_LRGMappingUploadDTO> {
    construct(rowParser : IRowParser<ERParamCU_LRGMappingUploadDTO>, updater : BulkUploadProcessUpdater, uploadFile : File) {
      super(rowParser, updater, uploadFile)
      _log = StructuredLogger.CONFIG.withClass(BulkERParamCU_LRGMappingProcessor)
    }

    override function processRows(rows : List<ERParamCU_LRGMappingUploadDTO>) : CSVProcessorResult {
      var dataRows = rows
      var rowProcessErrors = new ArrayList<RowProcessError>()
      _log.info("Importing ${dataRows.Count} ERParamCU_LRGMappings...")

      for (dataRow in dataRows index i) {
        var rowNumber = i + 1
        var lineNumber = i + 2
        createERParamCU_LRGMapping(lineNumber, dataRow, rowProcessErrors)
      }
      return new CSVProcessorResult(dataRows.Count - rowProcessErrors.Count, rowProcessErrors)
    }

    private function createERParamCU_LRGMapping(lineNumber : int, dto : ERParamCU_LRGMappingUploadDTO, rowProcessErrors : List<RowProcessError>) {
      try {
        var oEntity : ERParamCU_LRGMapping_ACC
        gw.transaction.Transaction.runWithNewBundle(\bundle -> {
          oEntity = new ERParamCU_LRGMapping_ACC()
          oEntity.PublicID = "er:"+dto.ERID
          if(dto.LRGCode != null) {
            var oERLRGCode = _erProcessUtils.getERParamLRG(dto.LRGCode, dto.LevyApplicationYear)
            if(oERLRGCode != null)
              oEntity.ERParamLRG = oERLRGCode
          }
          if(dto.CUCode != null) {
            var oERCUCode = _erProcessUtils.getERParamCU(dto.CUCode, dto.LevyApplicationYear, dto.LevyYear)
            if(oERCUCode != null)
              oEntity.ERParamCU = oERCUCode
          }
          oEntity.IsActive = dto.IsActive
          _log.info("${lineNumber}: Created ER Parameters CUCode-LRGCode Mapping")
        }, "sys")
        onSuccess()
      } catch (e : Exception) {
        _log.info("${lineNumber}: Creation of ER Parameters CUCode-LRGCode Mapping failed for ${dto}: ${e.Message}")
        rowProcessErrors.add(new RowProcessError(lineNumber, e.Message))
        onFailure()
      }
    }
  }
}