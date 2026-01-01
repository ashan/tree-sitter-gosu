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

class ER_DM_Load_ERFileImportDetails {

  public function MigrateERData(csvPath : String) {
    var executor = Executors.newWorkStealingPool(40)
    var inputFile = new File(csvPath+"ERFileImportDetails.csv")
    var bulkUploader : ERFileImportDetailsBulkUploader
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      bulkUploader = new ERFileImportDetailsBulkUploader(inputFile, inputFile.Name, BulkUploadType_ACC.TC_ERDATAMIGRATION)
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

  class ERFileImportDetailsBulkUploader extends AbstractBulkUploader {
    construct(uploadFile : File, uploadFileName : String, bulkUploadType : BulkUploadType_ACC) {
      super(uploadFile, uploadFileName, bulkUploadType)
    }
    override protected function getCSVProcessor(bulkUploadType : BulkUploadType_ACC, updater : BulkUploadProcessUpdater, uploadFile : File) : AbstractCSVProcessor {
      return new BulkERFileImportDetailsProcessor(new ERFileImportDetailsUploadParser(), updater, uploadFile)
    }
  }

  /*--- ER Data Objects ---*/
  class ERFileImportDetailsUploadDTO {
    public var erID: Integer as ERID = null
    public var uniqueFileName: String as UniqueFileName = null
    public var tabName: String as TabName = null
    public var status: ERFileImportStatus_ACC as Status = null
    public var tabProcessed: Date as TabProcessed = null

    public override function toString(): String {
      return "ERFileImportDetailsUploadDTO{" +
          "erID =" + erID + '' +
          ", uniqueFileName ='" + uniqueFileName + '\'' +
          ", tabName ='" + tabName + '\'' +
          ", status ='" + status + '\'' +
          ", tabProcessed ='" + tabProcessed + '\'' +
          '}';
    }
  }

  /*--- ER Upload Parsers ---*/
  class ERFileImportStatusParser implements IFieldParser<ERFileImportStatus_ACC> {
    override function parse(text: String): Either<FieldValidationError, ERFileImportStatus_ACC> {
      var oTypeItem = ERFileImportStatus_ACC.get(text)
      if (oTypeItem == null) {
        return Either.left(new FieldValidationError("Invalid ER File Import Status: ${text}"))
      } else {
        return Either.right(oTypeItem)
      }
    }
  }

  class ERFileImportDetailsUploadParser implements IRowParser<ERFileImportDetailsUploadDTO> {
    private final var dateParser = new DateParser()
    private final var erFileImportStatusParser = new ERFileImportStatusParser()
    override function parseRow(csvParser : CSVParser) : Either<List<FieldValidationError>, ERFileImportDetailsUploadDTO> {
      try {
        var erID = csvParser.nextString().trim().toOptional()
        var uniqueFileName = csvParser.nextString().trim().toOptional()
        var tabName = csvParser.nextString().trim().toOptional()
        var status = csvParser.nextString().trim().toOptional()
        var tabProcessed = csvParser.nextString().trim().toOptional()

        var parseErrors = verifyPresenceOfMandatoryFields(uniqueFileName, tabName, status)
        var dto = new ERFileImportDetailsUploadDTO()
        erID.each(\value -> {dto.ERID = Integer.valueOf(value)})
        uniqueFileName.each(\value -> {dto.UniqueFileName = value})
        tabName.each(\value -> {dto.TabName = value})
        parseField(parseErrors, erFileImportStatusParser, status,
            \parsedResult -> {dto.Status = parsedResult})
        parseField(parseErrors, dateParser, tabProcessed,
            \parsedResult -> {dto.TabProcessed = parsedResult})

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
        uniqueFileName : Optional<String>,
        tabName : Optional<String>,
        status : Optional<String>) : List<FieldValidationError> {
      var errors : LinkedList<FieldValidationError> = {}
      if (!uniqueFileName.isPresent())
        errors.add(new FieldValidationError("UniqueFileName is required"))
      if (!tabName.isPresent())
        errors.add(new FieldValidationError("TabName is required"))
      if (!status.isPresent())
        errors.add(new FieldValidationError("Status is required"))
      return errors
    }
  }

  /*--- ER Upload Processors ---*/
  class BulkERFileImportDetailsProcessor extends AbstractCSVProcessor<ERFileImportDetailsUploadDTO> {
    construct(rowParser : IRowParser<ERFileImportDetailsUploadDTO>, updater : BulkUploadProcessUpdater, uploadFile : File) {
      super(rowParser, updater, uploadFile)
      _log = StructuredLogger.CONFIG.withClass(BulkERFileImportDetailsProcessor)
    }

    override function processRows(rows : List<ERFileImportDetailsUploadDTO>) : CSVProcessorResult {
      var dataRows = rows
      var rowProcessErrors = new ArrayList<RowProcessError>()
      _log.info("Importing ${dataRows.Count} ERFileImportDetailss...")

      for (dataRow in dataRows index i) {
        var rowNumber = i + 1
        var lineNumber = i + 2
        createERFileImportDetails(lineNumber, dataRow, rowProcessErrors)
      }
      return new CSVProcessorResult(dataRows.Count - rowProcessErrors.Count, rowProcessErrors)
    }

    private function createERFileImportDetails(lineNumber : int, dto : ERFileImportDetailsUploadDTO, rowProcessErrors : List<RowProcessError>) {
      try {
        var oEntity : ERFileImportDetails_ACC
        gw.transaction.Transaction.runWithNewBundle(\bundle -> {
          oEntity = new ERFileImportDetails_ACC()
          oEntity.PublicID = "er:"+dto.ERID
          if(dto.UniqueFileName != null) {
            var oERFileImportLog = getERFileImportLog(dto.UniqueFileName)
            if(oERFileImportLog != null)
              oEntity.ERFileImportLog = oERFileImportLog
          }
          if(dto.TabName != null) {
            var oERFileTypeDetail = getERFileTypeDetail(dto.TabName)
            if(oERFileTypeDetail != null)
              oEntity.ERFileTypeDetail = oERFileTypeDetail
          }
          oEntity.ERFileImportStatus = dto.Status
          oEntity.TabProcessDate = dto.TabProcessed
          _log.info("${lineNumber}: Created ER File Import Details")
        }, "sys")
        onSuccess()
      } catch (e : Exception) {
        _log.info("${lineNumber}: Creation of ER File Import Details failed for ${dto}: ${e.Message}")
        rowProcessErrors.add(new RowProcessError(lineNumber, e.Message))
        onFailure()
      }
    }

    private function getERFileImportLog(uniqueFileName : String) : ERFileImportLog_ACC {
      return Query.make(ERFileImportLog_ACC)
          .compareIgnoreCase(ERFileImportLog_ACC#UniqueFileName, Relop.Equals, uniqueFileName)
          .select().AtMostOneRow
    }
    private function getERFileTypeDetail(tabName : String) : ERFileTypeDetail_ACC {
      return Query.make(ERFileTypeDetail_ACC)
          .compareIgnoreCase(ERFileTypeDetail_ACC#TabName, Relop.Equals, tabName)
          .select().AtMostOneRow
    }
  }
}