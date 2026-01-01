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

class ER_DM_Load_ERFileImportLog {

  public function MigrateERData(csvPath : String) {
    var executor = Executors.newWorkStealingPool(40)
    var inputFile = new File(csvPath+"ERFileImportLog.csv")
    var bulkUploader : ERFileImportLogBulkUploader
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      bulkUploader = new ERFileImportLogBulkUploader(inputFile, inputFile.Name, BulkUploadType_ACC.TC_ERDATAMIGRATION)
    })
    try {
      executor.submit(\-> bulkUploader.run())
    } catch (e : Exception) {
      print("Bulk uploader can not be scheduled for execution: "+e)
    }
    //shutdown ExecutorService
    executor.shutdown();
    while (!executor.isTerminated()) {   }
    System.out.println("Finished all ERFileImportLog threads");
  }

  class ERFileImportLogBulkUploader extends AbstractBulkUploader {
    construct(uploadFile : File, uploadFileName : String, bulkUploadType : BulkUploadType_ACC) {
      super(uploadFile, uploadFileName, bulkUploadType)
    }
    override protected function getCSVProcessor(bulkUploadType : BulkUploadType_ACC, updater : BulkUploadProcessUpdater, uploadFile : File) : AbstractCSVProcessor {
      return new BulkERFileImportLogProcessor(new ERFileImportLogUploadParser(), updater, uploadFile)
    }
  }

  /*--- ER Data Objects ---*/
  class ERFileImportLogUploadDTO {
    public var erID: Integer as ERID = null
    public var fileType: String as FileType = null
    public var fileName: String as FileName = null
    public var uniqueFileName: String as UniqueFileName = null
    public var uniqueFileNameExtension: String as UniqueFileNameExtension = null
    public var comment: String as Comment = null
    public var status: ERFileImportStatus_ACC as Status = null
    public var failureReason: String as FailureReason = null
    public var createTime: Date as CreateTime = null
    public var createUser: String as CreateUser = null
    public var createEmail: String as CreateEmail = null

    public override function toString(): String {
      return "ERFileImportLogUploadDTO{" +
          "erID =" + erID + '' +
          ", fileType ='" + fileType + '\'' +
          ", fileName ='" + fileName + '\'' +
          ", uniqueFileName ='" + uniqueFileName + '\'' +
          ", uniqueFileNameExtension ='" + uniqueFileNameExtension + '\'' +
          ", comment ='" + comment + '\'' +
          ", status ='" + status + '\'' +
          ", failureReason ='" + failureReason + '\'' +
          ", createTime ='" + createTime + '\'' +
          ", createUser ='" + createUser + '\'' +
          ", createEmail ='" + createEmail + '\'' +
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

  class ERFileImportLogUploadParser implements IRowParser<ERFileImportLogUploadDTO> {
    private final var dateParser = new DateParser()
    private final var erFileImportStatusParser = new ERFileImportStatusParser()
    override function parseRow(csvParser : CSVParser) : Either<List<FieldValidationError>, ERFileImportLogUploadDTO> {
      try {
        var erID = csvParser.nextString().trim().toOptional()
        var fileType = csvParser.nextString().trim().toOptional()
        var fileName = csvParser.nextString().trim().toOptional()
        var uniqueFileName = csvParser.nextString().trim().toOptional()
        var uniqueFileNameExtension = csvParser.nextString().trim().toOptional()
        var comment = csvParser.nextString().trim().toOptional()
        var status = csvParser.nextString().trim().toOptional()
        var failureReason = csvParser.nextString().trim().toOptional()
        var createTime = csvParser.nextString().trim().toOptional()
        var createUser = csvParser.nextString().trim().toOptional()
        var createEmail = csvParser.nextString().trim().toOptional()

        var parseErrors = verifyPresenceOfMandatoryFields(fileType, fileName, uniqueFileName, uniqueFileNameExtension, status)
        var dto = new ERFileImportLogUploadDTO()
        erID.each(\value -> {dto.ERID = Integer.valueOf(value)})
        fileType.each(\value -> {dto.FileType = value})
        fileName.each(\value -> {dto.FileName = value})
        uniqueFileName.each(\value -> {dto.UniqueFileName = value})
        uniqueFileNameExtension.each(\value -> {dto.UniqueFileNameExtension = value})
        comment.each(\value -> {dto.Comment = value})
        parseField(parseErrors, erFileImportStatusParser, status,
            \parsedResult -> {
              dto.Status = parsedResult
            })
        failureReason.each(\value -> {
          dto.FailureReason = value
        })
        parseField(parseErrors, dateParser, createTime,
            \parsedResult -> {dto.CreateTime = parsedResult})
        createUser.each(\value -> {dto.CreateUser = value})
        createEmail.each(\value -> {dto.CreateEmail = value})

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
        fileType : Optional<String>,
        fileName : Optional<String>,
        uniqueFileName : Optional<String>,
        uniqueFileNameExtension : Optional<String>,
        status : Optional<String>) : List<FieldValidationError> {
      var errors : LinkedList<FieldValidationError> = {}
      if (!fileType.isPresent())
        errors.add(new FieldValidationError("FileType is required"))
      if (!fileName.isPresent())
        errors.add(new FieldValidationError("FileName is required"))
      if (!uniqueFileName.isPresent())
        errors.add(new FieldValidationError("UniqueFileName is required"))
      if (!uniqueFileNameExtension.isPresent())
        errors.add(new FieldValidationError("UniqueFileNameExtension is required"))
      if (!status.isPresent())
        errors.add(new FieldValidationError("Status is required"))
      return errors
    }
  }

  /*--- ER Upload Processors ---*/
  class BulkERFileImportLogProcessor extends AbstractCSVProcessor<ERFileImportLogUploadDTO> {
    construct(rowParser : IRowParser<ERFileImportLogUploadDTO>, updater : BulkUploadProcessUpdater, uploadFile : File) {
      super(rowParser, updater, uploadFile)
      _log = StructuredLogger.CONFIG.withClass(BulkERFileImportLogProcessor)
    }

    override function processRows(rows : List<ERFileImportLogUploadDTO>) : CSVProcessorResult {
      var dataRows = rows
      var rowProcessErrors = new ArrayList<RowProcessError>()
      _log.info("Importing ${dataRows.Count} ERFileImportLogs...")

      for (dataRow in dataRows index i) {
        var rowNumber = i + 1
        var lineNumber = i + 2
        createERFileImportLog(lineNumber, dataRow, rowProcessErrors)
      }
      return new CSVProcessorResult(dataRows.Count - rowProcessErrors.Count, rowProcessErrors)
    }

    private function createERFileImportLog(lineNumber : int, dto : ERFileImportLogUploadDTO, rowProcessErrors : List<RowProcessError>) {
      try {
        var oEntity : ERFileImportLog_ACC
        gw.transaction.Transaction.runWithNewBundle(\bundle -> {
          oEntity = new ERFileImportLog_ACC()
          oEntity.PublicID = "er:"+dto.ERID
          if(dto.FileType != null) {
            var oERFileType = getERFileType(dto.FileType)
            if(oERFileType != null)
              oEntity.ERFileType = oERFileType
          }
          oEntity.FileName = dto.FileName
          oEntity.UniqueFileName = dto.UniqueFileName
          oEntity.UniqueFileNameExtension = dto.UniqueFileNameExtension
          oEntity.Comment = dto.Comment
          oEntity.ERFileImportStatus = dto.Status
          oEntity.FailureReason = dto.FailureReason
          _log.info("${lineNumber}: Created ER File Import Log")
        }, "sys")
        onSuccess()
      } catch (e : Exception) {
        _log.info("${lineNumber}: Creation of ER File Import Log failed for ${dto}: ${e.Message}")
        rowProcessErrors.add(new RowProcessError(lineNumber, e.Message))
        onFailure()
      }
    }

    private function getERFileType(fileType : String) : ERFileType_ACC {
      return Query.make(ERFileType_ACC)
          .compareIgnoreCase(ERFileType_ACC#FileType, Relop.Equals, fileType)
          .select().AtMostOneRow
    }
  }
}