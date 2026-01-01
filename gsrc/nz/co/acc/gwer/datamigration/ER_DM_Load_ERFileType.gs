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

class ER_DM_Load_ERFileType {

  public function MigrateERData(csvPath : String) {
    var executor = Executors.newWorkStealingPool(40)
    var inputFile = new File(csvPath+"ERFileType.csv")
    var bulkUploader : ERFileTypeBulkUploader
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      bulkUploader = new ERFileTypeBulkUploader(inputFile, inputFile.Name, BulkUploadType_ACC.TC_ERDATAMIGRATION)
    })
    try {
      executor.submit(\-> bulkUploader.run())
    } catch (e : Exception) {
      print("Bulk uploader can not be scheduled for execution: "+e)
    }
    //shutdown ExecutorService
    executor.shutdown();
    while (!executor.isTerminated()) {   }
    System.out.println("Finished all ERFileType threads");
  }

  class ERFileTypeBulkUploader extends AbstractBulkUploader {
    construct(uploadFile : File, uploadFileName : String, bulkUploadType : BulkUploadType_ACC) {
      super(uploadFile, uploadFileName, bulkUploadType)
    }
    override protected function getCSVProcessor(bulkUploadType : BulkUploadType_ACC, updater : BulkUploadProcessUpdater, uploadFile : File) : AbstractCSVProcessor {
      return new BulkERFileTypeProcessor(new ERFileTypeUploadParser(), updater, uploadFile)
    }
  }

  /*--- ER Data Objects ---*/
  class ERFileTypeUploadDTO {
    public var erID: Integer as ERID = null
    public var fileType: String as FileType = null
    public var supportedExtensions: String as SupportedExtensions = null
    public var excludeFromUI: Boolean as ExcludeFromUI = null

    public override function toString(): String {
      return "ERFileTypeUploadDTO{" +
          "erID =" + erID + '' +
          ", fileType ='" + fileType + '\'' +
          ", supportedExtensions ='" + supportedExtensions + '\'' +
          ", excludeFromUI ='" + excludeFromUI + '\'' +
          '}';
    }
  }

  /*--- ER Upload Parsers ---*/
  class ERFileTypeUploadParser implements IRowParser<ERFileTypeUploadDTO> {
    override function parseRow(csvParser : CSVParser) : Either<List<FieldValidationError>, ERFileTypeUploadDTO> {
      try {
        var erID = csvParser.nextString().trim().toOptional()
        var fileType = csvParser.nextString().trim().toOptional()
        var supportedExtensions = csvParser.nextString().trim().toOptional()
        var excludeFromUI = csvParser.nextString().trim().toOptional()

        var parseErrors = verifyPresenceOfMandatoryFields(fileType, supportedExtensions, excludeFromUI)
        var dto = new ERFileTypeUploadDTO()
        erID.each(\value -> {dto.ERID = Integer.valueOf(value)})
        fileType.each(\value -> {dto.FileType = value})
        supportedExtensions.each(\value -> {dto.SupportedExtensions = value})
        excludeFromUI.each(\value -> {
          if(Integer.valueOf(value)==1) {
            dto.ExcludeFromUI = Boolean.TRUE
          } else {
            dto.ExcludeFromUI = Boolean.FALSE
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
        fileType : Optional<String>,
        supportedExtensions : Optional<String>,
        excludeFromUI : Optional<String>) : List<FieldValidationError> {
      var errors : LinkedList<FieldValidationError> = {}
      if (!fileType.isPresent())
        errors.add(new FieldValidationError("FileType is required"))
      if (!supportedExtensions.isPresent())
        errors.add(new FieldValidationError("SupportedExtensions is required"))
      if (!excludeFromUI.isPresent())
        errors.add(new FieldValidationError("ExcludeFromUI is required"))
      return errors
    }
  }

  /*--- ER Upload Processors ---*/
  class BulkERFileTypeProcessor extends AbstractCSVProcessor<ERFileTypeUploadDTO> {
    construct(rowParser : IRowParser<ERFileTypeUploadDTO>, updater : BulkUploadProcessUpdater, uploadFile : File) {
      super(rowParser, updater, uploadFile)
      _log = StructuredLogger.CONFIG.withClass(BulkERFileTypeProcessor)
    }

    override function processRows(rows : List<ERFileTypeUploadDTO>) : CSVProcessorResult {
      var dataRows = rows
      var rowProcessErrors = new ArrayList<RowProcessError>()
      _log.info("Importing ${dataRows.Count} ERFileTypes...")

      for (dataRow in dataRows index i) {
        var rowNumber = i + 1
        var lineNumber = i + 2
        createERFileType(lineNumber, dataRow, rowProcessErrors)
      }
      return new CSVProcessorResult(dataRows.Count - rowProcessErrors.Count, rowProcessErrors)
    }

    private function createERFileType(lineNumber : int, dto : ERFileTypeUploadDTO, rowProcessErrors : List<RowProcessError>) {
      try {
        var oEntity : ERFileType_ACC
        gw.transaction.Transaction.runWithNewBundle(\bundle -> {
          oEntity = new ERFileType_ACC()
          oEntity.PublicID = "er:"+dto.ERID
          oEntity.FileType = dto.FileType
          oEntity.SupportedExtensions = dto.SupportedExtensions
          oEntity.ExcludeFromUI = dto.ExcludeFromUI
          _log.info("${lineNumber}: Created ER File Type")
        }, "sys")
        onSuccess()
      } catch (e : Exception) {
        _log.info("${lineNumber}: Creation of ER File Type failed for ${dto}: ${e.Message}")
        rowProcessErrors.add(new RowProcessError(lineNumber, e.Message))
        onFailure()
      }
    }
  }
}