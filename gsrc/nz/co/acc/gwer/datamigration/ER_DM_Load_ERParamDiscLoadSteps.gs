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

class ER_DM_Load_ERParamDiscLoadSteps {

  public function MigrateERData(csvPath : String) {
    var executor = Executors.newWorkStealingPool(40)
    var inputFile = new File(csvPath+"ERParamDiscLoadSteps.csv")
    var bulkUploader : ERParamDiscLoadStepsBulkUploader
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      bulkUploader = new ERParamDiscLoadStepsBulkUploader(inputFile, inputFile.Name, BulkUploadType_ACC.TC_ERDATAMIGRATION)
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

  class ERParamDiscLoadStepsBulkUploader extends AbstractBulkUploader {
    construct(uploadFile : File, uploadFileName : String, bulkUploadType : BulkUploadType_ACC) {
      super(uploadFile, uploadFileName, bulkUploadType)
    }
    override protected function getCSVProcessor(bulkUploadType : BulkUploadType_ACC, updater : BulkUploadProcessUpdater, uploadFile : File) : AbstractCSVProcessor {
      return new BulkERParamDiscLoadStepsProcessor(new ERParamDiscLoadStepsUploadParser(), updater, uploadFile)
    }
  }

  /*--- ER Data Objects ---*/
  class ERParamDiscLoadStepsUploadDTO {
    public var erID: Integer as ERID = null
    public var levyApplicationYear: Integer as LevyApplicationYear = null
    public var bandMin: Integer as BandMin = null
    public var bandMax: Integer as BandMax = null
    public var step: Integer as Step = null

    public override function toString(): String {
      return "ERParamDiscLoadStepsUploadDTO{" +
          "erID ='" + ERID + '\'' +
          ", levyApplicationYear ='" + levyApplicationYear + '\'' +
          ", bandMin ='" + bandMin + '\'' +
          ", bandMax ='" + bandMax + '\'' +
          ", step ='" + step + '\'' +
          '}';
    }
  }

  /*--- ER Upload Parsers ---*/
  class ERParamDiscLoadStepsUploadParser implements IRowParser<ERParamDiscLoadStepsUploadDTO> {
    override function parseRow(csvParser : CSVParser) : Either<List<FieldValidationError>, ERParamDiscLoadStepsUploadDTO> {
      try {
        var erID = csvParser.nextString().trim().toOptional()
        var levyApplicationYear = csvParser.nextString().trim().toOptional()
        var bandMin = csvParser.nextString().trim().toOptional()
        var bandMax = csvParser.nextString().trim().toOptional()
        var step = csvParser.nextString().trim().toOptional()

        var parseErrors = verifyPresenceOfMandatoryFields(levyApplicationYear, bandMin, bandMax, step)
        var dto = new ERParamDiscLoadStepsUploadDTO()
        erID.each(\value -> {dto.ERID = Integer.valueOf(value)})
        levyApplicationYear.each(\value -> {dto.LevyApplicationYear = Integer.valueOf(value)})
        bandMin.each(\value -> {dto.BandMin = Integer.valueOf(value)})
        bandMax.each(\value -> {dto.BandMax = Integer.valueOf(value)})
        step.each(\value -> {dto.Step = Integer.valueOf(value)})

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
        bandMin : Optional<String>,
        bandMax : Optional<String>,
        step : Optional<String>) : List<FieldValidationError> {

      var errors : LinkedList<FieldValidationError> = {}

      if (!levyApplicationYear.isPresent())
        errors.add(new FieldValidationError("LevyApplicationYear is required"))
      if (!bandMin.isPresent())
        errors.add(new FieldValidationError("BandMin is required"))
      if (!bandMax.isPresent())
        errors.add(new FieldValidationError("BandMax is required"))
      if (!step.isPresent())
        errors.add(new FieldValidationError("Step is required"))
      return errors
    }
  }

  /*--- ER Upload Processors ---*/
  class BulkERParamDiscLoadStepsProcessor extends AbstractCSVProcessor<ERParamDiscLoadStepsUploadDTO> {
    construct(rowParser : IRowParser<ERParamDiscLoadStepsUploadDTO>, updater : BulkUploadProcessUpdater, uploadFile : File) {
      super(rowParser, updater, uploadFile)
      _log = StructuredLogger.CONFIG.withClass(BulkERParamDiscLoadStepsProcessor)
    }

    override function processRows(rows : List<ERParamDiscLoadStepsUploadDTO>) : CSVProcessorResult {
      var dataRows = rows
      var rowProcessErrors = new ArrayList<RowProcessError>()
      _log.info("Importing ${dataRows.Count} ERParamDiscLoadStepss...")

      for (dataRow in dataRows index i) {
        var rowNumber = i + 1
        var lineNumber = i + 2
        createERParamDiscLoadSteps(lineNumber, dataRow, rowProcessErrors)
      }
      return new CSVProcessorResult(dataRows.Count - rowProcessErrors.Count, rowProcessErrors)
    }

    private function createERParamDiscLoadSteps(lineNumber : int, dto : ERParamDiscLoadStepsUploadDTO, rowProcessErrors : List<RowProcessError>) {
      try {
        var oEntity : ERParamDiscLoadSteps_ACC
        gw.transaction.Transaction.runWithNewBundle(\bundle -> {
          oEntity = new ERParamDiscLoadSteps_ACC()
          oEntity.PublicID = "er:"+dto.ERID
          oEntity.LevyApplicationYear = dto.LevyApplicationYear
          oEntity.BandMin = dto.BandMin
          oEntity.BandMax = dto.BandMax
          oEntity.Step = dto.Step
          _log.info("${lineNumber}: Created ER Parameters Discount/Loading Steps")
        }, "sys")
        onSuccess()
      } catch (e : Exception) {
        _log.info("${lineNumber}: Creation of ER Parameters Discount/Loading Steps failed for ${dto}: ${e.Message}")
        rowProcessErrors.add(new RowProcessError(lineNumber, e.Message))
        onFailure()
      }
    }
  }
}