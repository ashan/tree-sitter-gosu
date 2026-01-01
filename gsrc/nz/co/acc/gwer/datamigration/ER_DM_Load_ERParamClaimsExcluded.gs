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
uses gw.pl.util.csv.CSVParser
uses edge.util.either.Either

uses java.util.concurrent.Executors
uses java.io.File

class ER_DM_Load_ERParamClaimsExcluded {

  public function MigrateERData(csvPath : String) {
    var executor = Executors.newWorkStealingPool(40)
    var inputFile = new File(csvPath+"ERParamClaimsExcluded.csv")
    var bulkUploader : ERParamClaimsExcludedBulkUploader
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      bulkUploader = new ERParamClaimsExcludedBulkUploader(inputFile, inputFile.Name, BulkUploadType_ACC.TC_ERDATAMIGRATION)
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

  class ERParamClaimsExcludedBulkUploader extends AbstractBulkUploader {
    construct(uploadFile : File, uploadFileName : String, bulkUploadType : BulkUploadType_ACC) {
      super(uploadFile, uploadFileName, bulkUploadType)
    }
    override protected function getCSVProcessor(bulkUploadType : BulkUploadType_ACC, updater : BulkUploadProcessUpdater, uploadFile : File) : AbstractCSVProcessor {
      return new BulkERParamClaimsExcludedProcessor(new ERParamClaimsExcludedUploadParser(), updater, uploadFile)
    }
  }


  /*--- ER Data Objects ---*/
  class ERParamClaimsExcludedUploadDTO {
    public var erID: Integer as ERID = null
    public var levyApplicationYear: Integer as LevyApplicationYear = null
    public var claimsType: String as ClaimsType = null
    public var excludeFromCalc: Boolean as ExcludeFromCalc = null
    public var includeInFactor: Boolean as IncludeInFactor = null

    public override function toString(): String {
      return "ERParamClaimsExcludedUploadDTO{" +
          "erID =" + ERID + '' +
          ", levyApplicationYear =" + levyApplicationYear + '' +
          ", claimsType ='" + claimsType + '\'' +
          ", excludeFromCalc =" + excludeFromCalc + '' +
          ", includeInFactor =" + includeInFactor + '' +
          '}';
    }
  }

  /*--- ER Upload Parsers ---*/
  class ERParamClaimsExcludedUploadParser implements IRowParser<ERParamClaimsExcludedUploadDTO> {
    private final var dateParser = new DateParser()

    override function parseRow(csvParser : CSVParser) : Either<List<FieldValidationError>, ERParamClaimsExcludedUploadDTO> {
      try {
        var erID = csvParser.nextString().trim().toOptional()
        var levyApplicationYear = csvParser.nextString().trim().toOptional()
        var claimsType = csvParser.nextString().trim().toOptional()
        var excludeFromCalc = csvParser.nextString().trim().toOptional()
        var includeInFactor = csvParser.nextString().trim().toOptional()

        var parseErrors = verifyPresenceOfMandatoryFields(levyApplicationYear, claimsType, excludeFromCalc, includeInFactor)
        var dto = new ERParamClaimsExcludedUploadDTO()
        erID.each(\value -> {dto.ERID = Integer.valueOf(value)})
        levyApplicationYear.each(\value -> {dto.LevyApplicationYear = Integer.valueOf(value)})
        claimsType.each(\value -> {dto.ClaimsType = value})
        excludeFromCalc.each(\value -> {
          if(Integer.valueOf(value)==1) {
            dto.ExcludeFromCalc = Boolean.TRUE
          } else {
            dto.ExcludeFromCalc = Boolean.FALSE
          }
        })
        includeInFactor.each(\value -> {
          if(Integer.valueOf(value)==1) {
            dto.IncludeInFactor = Boolean.TRUE
          } else {
            dto.IncludeInFactor = Boolean.FALSE
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
        claimsType : Optional<String>,
        excludeFromCalc : Optional<String>,
        includeInFactor : Optional<String>) : List<FieldValidationError> {

      var errors : LinkedList<FieldValidationError> = {}

      if (!levyApplicationYear.isPresent())
        errors.add(new FieldValidationError("LevyApplicationYear is required"))
      if (!claimsType.isPresent())
        errors.add(new FieldValidationError("ClaimsType is required"))
      if (!excludeFromCalc.isPresent())
        errors.add(new FieldValidationError("ExcludeFromCalc is required"))
      if (!includeInFactor.isPresent())
        errors.add(new FieldValidationError("IncludeInFactor is required"))
      return errors
    }
  }

  /*--- ER Upload Processors ---*/
  class BulkERParamClaimsExcludedProcessor extends AbstractCSVProcessor<ERParamClaimsExcludedUploadDTO> {

    construct(rowParser : IRowParser<ERParamClaimsExcludedUploadDTO>, updater : BulkUploadProcessUpdater, uploadFile : File) {
      super(rowParser, updater, uploadFile)
      _log = StructuredLogger.CONFIG.withClass(BulkERParamClaimsExcludedProcessor)
    }

    override function processRows(rows : List<ERParamClaimsExcludedUploadDTO>) : CSVProcessorResult {
      var dataRows = rows
      var rowProcessErrors = new ArrayList<RowProcessError>()
      _log.info("Importing ${dataRows.Count} ERParamClaimsExcludeds...")

      for (dataRow in dataRows index i) {
        var rowNumber = i + 1
        var lineNumber = i + 2
        createERParamClaimsExcluded(lineNumber, dataRow, rowProcessErrors)
      }
      return new CSVProcessorResult(dataRows.Count - rowProcessErrors.Count, rowProcessErrors)
    }

    private function createERParamClaimsExcluded(lineNumber : int, dto : ERParamClaimsExcludedUploadDTO, rowProcessErrors : List<RowProcessError>) {
      try {
        var oEntity : ERParamClaimsExcluded_ACC
        gw.transaction.Transaction.runWithNewBundle(\bundle -> {
          oEntity = new ERParamClaimsExcluded_ACC()
          oEntity.PublicID = "er:"+dto.ERID
          oEntity.LevyApplicationYear = dto.LevyApplicationYear
          oEntity.ClaimsType = dto.ClaimsType
          oEntity.ExcludeFromCalc = dto.ExcludeFromCalc
          oEntity.IncludeInFactor = dto.IncludeInFactor
          _log.info("${lineNumber}: Created ER Parameters Claims Excluded")
        }, "sys")
        onSuccess()
      } catch (e : Exception) {
        _log.info("${lineNumber}: Creation of ER Parameters Claims Excluded failed for ${dto}: ${e.Message}")
        rowProcessErrors.add(new RowProcessError(lineNumber, e.Message))
        onFailure()
      }
    }
  }
}