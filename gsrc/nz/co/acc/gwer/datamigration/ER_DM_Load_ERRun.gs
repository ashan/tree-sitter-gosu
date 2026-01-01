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

uses java.io.File
uses java.util.concurrent.Executors

class ER_DM_Load_ERRun {
  public function MigrateERData(csvPath : String) {
    var executor = Executors.newWorkStealingPool(40)
    var inputFile = new File(csvPath+"ERRun.csv")
    var bulkUploader : ERRunBulkUploader
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      bulkUploader = new ERRunBulkUploader(inputFile, inputFile.Name, BulkUploadType_ACC.TC_ERDATAMIGRATION)
    })
    try {
      executor.submit(\-> bulkUploader.run())
    } catch (e : Exception) {
      print("Bulk uploader can not be scheduled for execution: "+e)
    }
    //shutdown ExecutorService
    executor.shutdown();
    while (!executor.isTerminated()) {   }
    System.out.println("Finished all ERRun threads");
  }

  class ERRunBulkUploader extends AbstractBulkUploader {
    construct(uploadFile : File, uploadFileName : String, bulkUploadType : BulkUploadType_ACC) {
      super(uploadFile, uploadFileName, bulkUploadType)
    }
    override protected function getCSVProcessor(bulkUploadType : BulkUploadType_ACC, updater : BulkUploadProcessUpdater, uploadFile : File) : AbstractCSVProcessor {
      return new BulkERRunProcessor(new ERRunUploadParser(), updater, uploadFile)
    }
  }

  /*--- ER Data Objects ---*/
  class ERRunUploadDTO {
    public var erID: Integer as ERID = null
    public var runID: Integer as RunID = null
    public var requestID: Integer as RequestID = null
    public var runStatus: ERRunStatus_ACC as ERRunStatus = null
    public var runDateTime: Date as RunDateTime = null

    public override function toString(): String {
      return "ERRunUploadDTO{" +
          "erID =" + erID + '' +
          ", runID =" + runID + '' +
          ", requestID =" + requestID + '' +
          ", runStatus ='" + runStatus + '\'' +
          ", runDateTime ='" + runDateTime + '\'' +
          '}';
    }
  }

  /*--- ER Upload Parsers ---*/
  class ERRunStatusParser implements IFieldParser<ERRunStatus_ACC> {
    override function parse(text: String): Either<FieldValidationError, ERRunStatus_ACC> {
      var oTypeItem = ERRunStatus_ACC.get(text)
      if (oTypeItem == null) {
        return Either.left(new FieldValidationError("Invalid ER Run Status: ${text}"))
      } else {
        return Either.right(oTypeItem)
      }
    }
  }

  class ERRunUploadParser implements IRowParser<ERRunUploadDTO> {
    private final var dateParser = new DateParser()
    private final var erRunStatusParser = new ERRunStatusParser()

    override function parseRow(csvParser : CSVParser) : Either<List<FieldValidationError>, ERRunUploadDTO> {
      try {
        var erID = csvParser.nextString().trim().toOptional()
        var runID = csvParser.nextString().trim().toOptional()
        var requestID = csvParser.nextString().trim().toOptional()
        var runStatus = csvParser.nextString().trim().toOptional()
        var runDateTime = csvParser.nextString().trim().toOptional()

        var parseErrors = verifyPresenceOfMandatoryFields(runID, requestID, runStatus, runDateTime)
        var dto = new ERRunUploadDTO()
        erID.each(\value -> {dto.ERID = Integer.valueOf(value)})
        runID.each(\value -> {dto.RunID = Integer.valueOf(value)})
        requestID.each(\value -> {dto.RequestID = Integer.valueOf(value)})
        parseField(parseErrors, erRunStatusParser, runStatus,
            \parsedResult -> {
              dto.runStatus = parsedResult})
        parseField(parseErrors, dateParser, runDateTime,
            \parsedResult -> {dto.RunDateTime = parsedResult})

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
        requestID : Optional<String>,
        runStatus : Optional<String>,
        runDateTime : Optional<String>) : List<FieldValidationError> {
      var errors : LinkedList<FieldValidationError> = {}
      if (!runID.isPresent())
        errors.add(new FieldValidationError("RunID is required"))
      if (!requestID.isPresent())
        errors.add(new FieldValidationError("RequestID is required"))
      if (!runStatus.isPresent())
        errors.add(new FieldValidationError("RunStatus is required"))
      if (!runDateTime.isPresent())
        errors.add(new FieldValidationError("RunDateTime is required"))
      return errors
    }
  }

  /*--- ER Upload Processors ---*/
  class BulkERRunProcessor extends AbstractCSVProcessor<ERRunUploadDTO> {
    construct(rowParser : IRowParser<ERRunUploadDTO>, updater : BulkUploadProcessUpdater, uploadFile : File) {
      super(rowParser, updater, uploadFile)
      _log = StructuredLogger.CONFIG.withClass(BulkERRunProcessor)
    }

    override function processRows(rows : List<ERRunUploadDTO>) : CSVProcessorResult {
      var dataRows = rows
      var rowProcessErrors = new ArrayList<RowProcessError>()
      _log.info("Importing ${dataRows.Count} ERRuns...")

      for (dataRow in dataRows index i) {
        var rowNumber = i + 1
        var lineNumber = i + 2
        createERRun(lineNumber, dataRow, rowProcessErrors)
      }
      return new CSVProcessorResult(dataRows.Count - rowProcessErrors.Count, rowProcessErrors)
    }

    private function createERRun(lineNumber : int, dto : ERRunUploadDTO, rowProcessErrors : List<RowProcessError>) {
      try {
        var oEntity : ERRun_ACC
        gw.transaction.Transaction.runWithNewBundle(\bundle -> {
          oEntity = new ERRun_ACC()
          oEntity.PublicID = "er:"+dto.RunID
          if(dto.RequestID != null) {
            var oERRequest = getERRequest("er:" + dto.RequestID)
            if(oERRequest != null)
              oEntity.ERRequest = oERRequest
          }
          oEntity.ERRunStatus = dto.ERRunStatus
          oEntity.RunDateTime = dto.RunDateTime
          _log.info("${lineNumber}: Created ER Run")
        }, "sys")
        onSuccess()
      } catch (e : Exception) {
        _log.info("${lineNumber}: Creation of ER Run failed for ${dto}: ${e.Message}")
        rowProcessErrors.add(new RowProcessError(lineNumber, e.Message))
        onFailure()
      }
    }
    private function getERRequest(publicID : String) : ERRequest_ACC {
      return Query.make(ERRequest_ACC)
          .compareIgnoreCase(ERRequest_ACC#PublicID, Relop.Equals, publicID)
          .select().AtMostOneRow
    }
  }
}