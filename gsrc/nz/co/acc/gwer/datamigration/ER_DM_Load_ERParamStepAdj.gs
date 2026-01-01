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

class ER_DM_Load_ERParamStepAdj {

  public function MigrateERData(csvPath : String) {
    var executor = Executors.newWorkStealingPool(40)
    var inputFile = new File(csvPath+"ERParamStepAdj.csv")
    var bulkUploader : ERParamStepAdjBulkUploader
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      bulkUploader = new ERParamStepAdjBulkUploader(inputFile, inputFile.Name, BulkUploadType_ACC.TC_ERDATAMIGRATION)
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

  class ERParamStepAdjBulkUploader extends AbstractBulkUploader {
    construct(uploadFile : File, uploadFileName : String, bulkUploadType : BulkUploadType_ACC) {
      super(uploadFile, uploadFileName, bulkUploadType)
    }
    override protected function getCSVProcessor(bulkUploadType : BulkUploadType_ACC, updater : BulkUploadProcessUpdater, uploadFile : File) : AbstractCSVProcessor {
      return new BulkERParamStepAdjProcessor(new ERParamStepAdjUploadParser(), updater, uploadFile)
    }
  }

  /*--- ER Data Objects ---*/
  class ERParamStepAdjUploadDTO {
    public var erID: Integer as ERID = null
    public var levyApplicationYear: Integer as LevyApplicationYear = null
    public var year1Adjustment: Integer as Year1Adjustment = null
    public var year2Adjustment: Integer as Year2Adjustment = null
    public var year3Adjustment: Integer as Year3Adjustment = null

    public override function toString(): String {
      return "ERParamStepAdjUploadDTO{" +
          "erID =" + ERID + '' +
          ", levyApplicationYear ='" + levyApplicationYear + '\'' +
          ", year1Adjustment ='" + year1Adjustment + '\'' +
          ", year2Adjustment ='" + year2Adjustment + '\'' +
          ", year3Adjustment ='" + year3Adjustment + '\'' +
          '}';
    }
  }

  /*--- ER Upload Parsers ---*/
  class ERParamStepAdjUploadParser implements IRowParser<ERParamStepAdjUploadDTO> {
    override function parseRow(csvParser : CSVParser) : Either<List<FieldValidationError>, ERParamStepAdjUploadDTO> {
      try {
        var erID = csvParser.nextString().trim().toOptional()
        var levyApplicationYear = csvParser.nextString().trim().toOptional()
        var year1Adjustment = csvParser.nextString().trim().toOptional()
        var year2Adjustment = csvParser.nextString().trim().toOptional()
        var year3Adjustment = csvParser.nextString().trim().toOptional()

        var parseErrors = verifyPresenceOfMandatoryFields(levyApplicationYear, year1Adjustment, year2Adjustment, year3Adjustment)
        var dto = new ERParamStepAdjUploadDTO()
        erID.each(\value -> {dto.ERID = Integer.valueOf(value)})
        levyApplicationYear.each(\value -> {dto.LevyApplicationYear = Integer.valueOf(value)})
        year1Adjustment.each(\value -> {dto.Year1Adjustment = Integer.valueOf(value)})
        year2Adjustment.each(\value -> {dto.Year2Adjustment = Integer.valueOf(value)})
        year3Adjustment.each(\value -> {dto.Year3Adjustment = Integer.valueOf(value)})

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
        year1Adjustment : Optional<String>,
        year2Adjustment : Optional<String>,
        year3Adjustment : Optional<String>) : List<FieldValidationError> {
      var errors : LinkedList<FieldValidationError> = {}
      if (!levyApplicationYear.isPresent())
        errors.add(new FieldValidationError("LevyApplicationYear is required"))
      if (!year1Adjustment.isPresent())
        errors.add(new FieldValidationError("Year1Adjustment is required"))
      if (!year2Adjustment.isPresent())
        errors.add(new FieldValidationError("Year2Adjustment is required"))
      if (!year3Adjustment.isPresent())
        errors.add(new FieldValidationError("Year3Adjustment is required"))
      return errors
    }
  }

  /*--- ER Upload Processors ---*/
  class BulkERParamStepAdjProcessor extends AbstractCSVProcessor<ERParamStepAdjUploadDTO> {
    construct(rowParser : IRowParser<ERParamStepAdjUploadDTO>, updater : BulkUploadProcessUpdater, uploadFile : File) {
      super(rowParser, updater, uploadFile)
      _log = StructuredLogger.CONFIG.withClass(BulkERParamStepAdjProcessor)
    }

    override function processRows(rows : List<ERParamStepAdjUploadDTO>) : CSVProcessorResult {
      var dataRows = rows
      var rowProcessErrors = new ArrayList<RowProcessError>()
      _log.info("Importing ${dataRows.Count} ERParamStepAdjs...")

      for (dataRow in dataRows index i) {
        var rowNumber = i + 1
        var lineNumber = i + 2
        createERParamStepAdj(lineNumber, dataRow, rowProcessErrors)
      }
      return new CSVProcessorResult(dataRows.Count - rowProcessErrors.Count, rowProcessErrors)
    }

    private function createERParamStepAdj(lineNumber : int, dto : ERParamStepAdjUploadDTO, rowProcessErrors : List<RowProcessError>) {
      try {
        var oEntity : ERParamStepAdj_ACC
        gw.transaction.Transaction.runWithNewBundle(\bundle -> {
          oEntity = new ERParamStepAdj_ACC()
          oEntity.PublicID = "er:"+dto.ERID
          oEntity.LevyApplicationYear = dto.LevyApplicationYear
          oEntity.Year1Adjustment = dto.Year1Adjustment
          oEntity.Year2Adjustment = dto.Year2Adjustment
          oEntity.Year3Adjustment = dto.Year3Adjustment
          _log.info("${lineNumber}: Created ER Parameters Step Adjustment")
        }, "sys")
        onSuccess()
      } catch (e : Exception) {
        _log.info("${lineNumber}: Creation of ER Parameters Step Adjustment failed for ${dto}: ${e.Message}")
        rowProcessErrors.add(new RowProcessError(lineNumber, e.Message))
        onFailure()
      }
    }
  }
}