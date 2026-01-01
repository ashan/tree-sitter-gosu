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

class ER_DM_Load_ERCalcTypeLevyYear {

  public function MigrateERData(csvPath : String) {
    var executor = Executors.newWorkStealingPool(40)
    var inputFile = new File(csvPath + "ERCalcTypeLevyYear.csv")
    var bulkUploader : ERCalcTypeLevyYearBulkUploader
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      bulkUploader = new ERCalcTypeLevyYearBulkUploader(inputFile, inputFile.Name, BulkUploadType_ACC.TC_ERDATAMIGRATION)
    })
    try {
      executor.submit(\-> bulkUploader.run())
    } catch (e : Exception) {
      print("Bulk uploader can not be scheduled for execution: " + e)
    }
    //shutdown ExecutorService
    executor.shutdown();
    while (!executor.isTerminated()) {   }
    System.out.println("Finished all ERBusinessGroup threads");
  }

  class ERCalcTypeLevyYearBulkUploader extends AbstractBulkUploader {
    construct(uploadFile : File, uploadFileName : String, bulkUploadType : BulkUploadType_ACC) {
      super(uploadFile, uploadFileName, bulkUploadType)
    }

    override protected function getCSVProcessor(bulkUploadType : BulkUploadType_ACC, updater : BulkUploadProcessUpdater, uploadFile : File) : AbstractCSVProcessor {
      return new BulkERCalcTypeLevyYearProcessor(new ERCalcTypeLevyYearUploadParser(), updater, uploadFile)
    }
  }

  /*--- ER Data Objects ---*/
  class ERCalcTypeLevyYearUploadDTO {
    public var erID : Integer as ERID = null
    public var levyYear : Integer as LevyYear = null
    public var programme : ERProgramme_ACC as Programme = null
    public var calculationType : ERCalculationType_ACC as CalculationType = null

    public override function toString() : String {
      return "ERCalcTypeLevyYearUploadDTO{" +
          "erID =" + ERID + '' +
          ", levyYear ='" + levyYear + '\'' +
          ", programme ='" + programme + '\'' +
          ", calculationType ='" + calculationType + '\'' +
          '}';
    }
  }

  /*--- ER Upload Parsers ---*/
  class ERProgrammeParser implements IFieldParser<ERProgramme_ACC> {
    override function parse(text : String) : Either<FieldValidationError, ERProgramme_ACC> {
      var oTypeItem = ERProgramme_ACC.get(text)
      if (oTypeItem == null) {
        return Either.left(new FieldValidationError("Invalid ER Programme Code: ${text}"))
      } else {
        return Either.right(oTypeItem)
      }
    }
  }

  class ERCalculationTypeParser implements IFieldParser<ERCalculationType_ACC> {
    override function parse(text : String) : Either<FieldValidationError, ERCalculationType_ACC> {
      var oTypeItem = ERCalculationType_ACC.get(text)
      if (oTypeItem == null) {
        return Either.left(new FieldValidationError("Invalid ER Calculation Type: ${text}"))
      } else {
        return Either.right(oTypeItem)
      }
    }
  }

  class ERCalcTypeLevyYearUploadParser implements IRowParser<ERCalcTypeLevyYearUploadDTO> {
    private final var erProgrammeParser = new ERProgrammeParser()
    private final var erCalculationTypeParser = new ERCalculationTypeParser()

    override function parseRow(csvParser : CSVParser) : Either<List<FieldValidationError>, ERCalcTypeLevyYearUploadDTO> {
      try {
        var erID = csvParser.nextString().trim().toOptional()
        var levyYear = csvParser.nextString().trim().toOptional()
        var programme = csvParser.nextString().trim().toOptional()
        var calculationType = csvParser.nextString().trim().toOptional()

        var parseErrors = verifyPresenceOfMandatoryFields(levyYear, programme, calculationType)
        var dto = new ERCalcTypeLevyYearUploadDTO()
        erID.each(\value -> {
          dto.ERID = Integer.valueOf(value)
        })
        levyYear.each(\value -> {
          dto.LevyYear = Integer.valueOf(value)
        })
        parseField(parseErrors, erProgrammeParser, programme,
            \parsedResult -> {
              dto.Programme = parsedResult
            })
        parseField(parseErrors, erCalculationTypeParser, calculationType,
            \parsedResult -> {
              dto.CalculationType = parsedResult
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

    /**
     * Generic function to parse a single CSV field
     **/
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
        levyYear : Optional<String>,
        programme : Optional<String>,
        calculationType : Optional<String>) : List<FieldValidationError> {
      var errors : LinkedList<FieldValidationError> = {}
      if (!levyYear.isPresent())
        errors.add(new FieldValidationError("LevyYear is required"))
      if (!programme.isPresent())
        errors.add(new FieldValidationError("ERProgramme is required"))
      if (!calculationType.isPresent())
        errors.add(new FieldValidationError("ERCalculationType is required"))
      return errors
    }
  }

  /*--- ER Upload Processors ---*/
  class BulkERCalcTypeLevyYearProcessor extends AbstractCSVProcessor<ERCalcTypeLevyYearUploadDTO> {
    construct(rowParser : IRowParser<ERCalcTypeLevyYearUploadDTO>, updater : BulkUploadProcessUpdater, uploadFile : File) {
      super(rowParser, updater, uploadFile)
      _log = StructuredLogger.CONFIG.withClass(BulkERCalcTypeLevyYearProcessor)
    }

    override function processRows(rows : List<ERCalcTypeLevyYearUploadDTO>) : CSVProcessorResult {
      var dataRows = rows
      var rowProcessErrors = new ArrayList<RowProcessError>()
      _log.info("Importing ${dataRows.Count} ERCalcTypeLevyYears...")

      for (dataRow in dataRows index i) {
        var rowNumber = i + 1
        var lineNumber = i + 2
        createERCalcTypeLevyYear(lineNumber, dataRow, rowProcessErrors)
      }
      return new CSVProcessorResult(dataRows.Count - rowProcessErrors.Count, rowProcessErrors)
    }

    private function createERCalcTypeLevyYear(lineNumber : int, dto : ERCalcTypeLevyYearUploadDTO, rowProcessErrors : List<RowProcessError>) {
      try {
        var oEntity : ERCalcTypeLevyYear_ACC
        gw.transaction.Transaction.runWithNewBundle(\bundle -> {
          oEntity = new ERCalcTypeLevyYear_ACC()
          oEntity.PublicID = "er:" + dto.ERID
          oEntity.LevyYear = dto.LevyYear
          oEntity.ERProgramme = dto.Programme
          oEntity.ERCalculationType = dto.CalculationType
          _log.info("${lineNumber}: Created ER Calculation Type per LevyYear")
        }, "sys")
        onSuccess()
      } catch (e : Exception) {
        _log.info("${lineNumber}: Creation of ER Calculation Type per LevyYear failed for ${dto}: ${e.Message}")
        rowProcessErrors.add(new RowProcessError(lineNumber, e.Message))
        onFailure()
      }
    }
  }
}