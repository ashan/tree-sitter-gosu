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

class ER_DM_Load_ERParamValue {

  public function MigrateERData(csvPath : String) {
    var executor = Executors.newWorkStealingPool(40)
    var inputFile = new File(csvPath+"ERParamValue.csv")
    var bulkUploader : ERParamValueBulkUploader
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      bulkUploader = new ERParamValueBulkUploader(inputFile, inputFile.Name, BulkUploadType_ACC.TC_ERDATAMIGRATION)
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

  class ERParamValueBulkUploader extends AbstractBulkUploader {
    construct(uploadFile : File, uploadFileName : String, bulkUploadType : BulkUploadType_ACC) {
      super(uploadFile, uploadFileName, bulkUploadType)
    }
    override protected function getCSVProcessor(bulkUploadType : BulkUploadType_ACC, updater : BulkUploadProcessUpdater, uploadFile : File) : AbstractCSVProcessor {
      return new BulkERParamValueProcessor(new ERParamValueUploadParser(), updater, uploadFile)
    }
  }

  /*--- ER Data Objects ---*/
  class ERParamValueUploadDTO {
    public var erID: Integer as ERID = null
    public var levyApplicationYear: Integer as LevyApplicationYear = null
    public var eRParameterCode: ERParametersCode_ACC as ERParameterCode = null
    public var eRParameterValue: String as ERParameterValue = null

    public override function toString(): String {
      return "ERParamValueUploadDTO{" +
          "erID =" + ERID + '' +
          ", levyApplicationYear =" + levyApplicationYear + '' +
          ", eRParameterCode ='" + eRParameterCode + '\'' +
          ", eRParameterValue ='" + eRParameterValue + '\'' +
          '}';
    }
  }

  /*--- ER Upload Parsers ---*/
  class ERParamCodeParser implements IFieldParser<ERParametersCode_ACC> {
    override function parse(text: String): Either<FieldValidationError, ERParametersCode_ACC> {
      var oTypeItem = ERParametersCode_ACC.get(text)
      if (oTypeItem == null) {
        return Either.left(new FieldValidationError("Invalid ER Parameters Code: ${text}"))
      } else {
        return Either.right(oTypeItem)
      }
    }
  }

  class ERParamValueUploadParser implements IRowParser<ERParamValueUploadDTO> {
    private final var erParamCodeParser = new ERParamCodeParser()
    override function parseRow(csvParser : CSVParser) : Either<List<FieldValidationError>, ERParamValueUploadDTO> {
      try {
        var erID = csvParser.nextString().trim().toOptional()
        var levyApplicationYear = csvParser.nextString().trim().toOptional()
        var eRParameterCode = csvParser.nextString().trim().toOptional()
        var eRParameterValue = csvParser.nextString().trim().toOptional()

        var parseErrors = verifyPresenceOfMandatoryFields(levyApplicationYear, eRParameterCode, eRParameterValue)
        var dto = new ERParamValueUploadDTO()
        erID.each(\value -> {dto.ERID = Integer.valueOf(value)})
        levyApplicationYear.each(\value -> {dto.LevyApplicationYear = Integer.valueOf(value)})
        parseField(parseErrors, erParamCodeParser, eRParameterCode,
            \parsedResult -> {dto.ERParameterCode = parsedResult})
        eRParameterValue.each(\value -> {dto.ERParameterValue = value})

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
        eRParameterCode : Optional<String>,
        eRParameterValue : Optional<String>) : List<FieldValidationError> {
      var errors : LinkedList<FieldValidationError> = {}
      if (!levyApplicationYear.isPresent())
        errors.add(new FieldValidationError("LevyApplicationYear is required"))
      if (!eRParameterCode.isPresent())
        errors.add(new FieldValidationError("ERParameterCode is required"))
      if (!eRParameterValue.isPresent())
        errors.add(new FieldValidationError("ERParameterValue is required"))
      return errors
    }
  }

  /*--- ER Upload Processors ---*/
  class BulkERParamValueProcessor extends AbstractCSVProcessor<ERParamValueUploadDTO> {
    construct(rowParser : IRowParser<ERParamValueUploadDTO>, updater : BulkUploadProcessUpdater, uploadFile : File) {
      super(rowParser, updater, uploadFile)
      _log = StructuredLogger.CONFIG.withClass(BulkERParamValueProcessor)
    }

    override function processRows(rows : List<ERParamValueUploadDTO>) : CSVProcessorResult {
      var dataRows = rows
      var rowProcessErrors = new ArrayList<RowProcessError>()
      _log.info("Importing ${dataRows.Count} ERParamValues...")

      for (dataRow in dataRows index i) {
        var rowNumber = i + 1
        var lineNumber = i + 2
        createERParamValue(lineNumber, dataRow, rowProcessErrors)
      }
      return new CSVProcessorResult(dataRows.Count - rowProcessErrors.Count, rowProcessErrors)
    }

    private function createERParamValue(lineNumber : int, dto : ERParamValueUploadDTO, rowProcessErrors : List<RowProcessError>) {
      try {
        var oEntity : ERParamValue_ACC
        gw.transaction.Transaction.runWithNewBundle(\bundle -> {
          oEntity = new ERParamValue_ACC()
          oEntity.PublicID = "er:"+dto.ERID
          oEntity.LevyApplicationYear = dto.LevyApplicationYear
          oEntity.ERParameterCode = dto.ERParameterCode
          oEntity.ERParameterValue = dto.ERParameterValue
          _log.info("${lineNumber}: Created ER Parameters Value")
        }, "sys")
        onSuccess()
      } catch (e : Exception) {
        _log.info("${lineNumber}: Creation of ER Parameters Value failed for ${dto}: ${e.Message}")
        rowProcessErrors.add(new RowProcessError(lineNumber, e.Message))
        onFailure()
      }
    }
  }
}