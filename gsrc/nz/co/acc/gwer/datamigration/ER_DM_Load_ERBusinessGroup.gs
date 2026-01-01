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

class ER_DM_Load_ERBusinessGroup {

  public function MigrateERData(csvPath : String) {
    var executor = Executors.newWorkStealingPool(40)
    var inputFile = new File(csvPath+"ERBusinessGroup.csv")
    var bulkUploader : ERBusinessGroupBulkUploader
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      bulkUploader = new ERBusinessGroupBulkUploader(inputFile, inputFile.Name, BulkUploadType_ACC.TC_ERDATAMIGRATION)
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

  class ERBusinessGroupBulkUploader extends AbstractBulkUploader {
    construct(uploadFile : File, uploadFileName : String, bulkUploadType : BulkUploadType_ACC) {
      super(uploadFile, uploadFileName, bulkUploadType)
    }
    override protected function getCSVProcessor(bulkUploadType : BulkUploadType_ACC, updater : BulkUploadProcessUpdater, uploadFile : File) : AbstractCSVProcessor {
      return new BulkERBusinessGroupProcessor(new ERBusinessGroupUploadParser(), updater, uploadFile)
    }
  }

  /*--- ER Data Objects ---*/
  class ERBusinessGroupUploadDTO {
    public var erID: Integer as ERID = null
    public var businessGroupID: String as BusinessGroupID = null
    public var suppressGroupLetters: Boolean as SuppressGroupLetters = null
    public var createTime: Date as CreateTime = null
    public var createUser: String as CreateUser = null

    public override function toString(): String {
      return "ERBusinessGroupUploadDTO{" +
          "erID =" + ERID + '' +
          ", businessGroupID ='" + businessGroupID + '\'' +
          ", suppressGroupLetters =" + suppressGroupLetters + '' +
          ", createTime ='" + createTime + '\'' +
          ", createUser ='" + createUser + '\'' +
          '}';
    }
  }

  /*--- ER Upload Parsers ---*/
  class ERBusinessGroupUploadParser implements IRowParser<ERBusinessGroupUploadDTO> {
    private final var dateParser = new DateParser()
    override function parseRow(csvParser : CSVParser) : Either<List<FieldValidationError>, ERBusinessGroupUploadDTO> {
      try {
        var erID = csvParser.nextString().trim().toOptional()
        var businessGroupID = csvParser.nextString().trim().toOptional()
        var suppressGroupLetters = csvParser.nextString().trim().toOptional()
        var createTime = csvParser.nextString().trim().toOptional()
        var createUser = csvParser.nextString().trim().toOptional()

        var parseErrors = verifyPresenceOfMandatoryFields(businessGroupID,suppressGroupLetters)
        var dto = new ERBusinessGroupUploadDTO()
        erID.each(\value -> {dto.ERID = Integer.valueOf(value)})
        businessGroupID.each(\value -> {dto.businessGroupID = value})
        suppressGroupLetters.each(\value -> {
          if(Integer.valueOf(value)==1) {
            dto.SuppressGroupLetters = Boolean.TRUE
          } else {
            dto.SuppressGroupLetters = Boolean.FALSE
          }
        })
        parseField(parseErrors, dateParser, createTime,
            \parsedResult -> {dto.CreateTime = parsedResult})
        createUser.each(\value -> {dto.CreateUser = value})

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
        businessGroupID : Optional<String>,
        suppressGroupLetters : Optional<String>) : List<FieldValidationError> {

      var errors : LinkedList<FieldValidationError> = {}

      if (!businessGroupID.isPresent()) {
        errors.add(new FieldValidationError("BusinessGroupID is required"))
      }
      if (!suppressGroupLetters.isPresent()) {
        errors.add(new FieldValidationError("SuppressGroupLetters is required"))
      }
      return errors
    }
  }

  /*--- ER Upload Processors ---*/
  class BulkERBusinessGroupProcessor extends AbstractCSVProcessor<ERBusinessGroupUploadDTO> {
    construct(rowParser : IRowParser<ERBusinessGroupUploadDTO>, updater : BulkUploadProcessUpdater, uploadFile : File) {
      super(rowParser, updater, uploadFile)
      _log = StructuredLogger.CONFIG.withClass(BulkERBusinessGroupProcessor)
    }

    override function processRows(rows : List<ERBusinessGroupUploadDTO>) : CSVProcessorResult {
      var dataRows = rows
      var rowProcessErrors = new ArrayList<RowProcessError>()
      _log.info("Importing ${dataRows.Count} ERBusinessGroups...")

      for (dataRow in dataRows index i) {
        var rowNumber = i + 1
        var lineNumber = i + 2
        createERBusinessGroup(lineNumber, dataRow, rowProcessErrors)
      }
      return new CSVProcessorResult(dataRows.Count - rowProcessErrors.Count, rowProcessErrors)
    }

    private function createERBusinessGroup(lineNumber : int, dto : ERBusinessGroupUploadDTO, rowProcessErrors : List<RowProcessError>) {
      try {
        var oEntity : ERBusinessGroup_ACC
        gw.transaction.Transaction.runWithNewBundle(\bundle -> {
          oEntity = new ERBusinessGroup_ACC()
          oEntity.PublicID = "er:"+dto.BusinessGroupID
          oEntity.BusinessGroupID = dto.BusinessGroupID
          oEntity.SuppressGroupLetters = dto.SuppressGroupLetters
          _log.info("${lineNumber}: Created ER Business Group")
        }, "sys")
        onSuccess()
      } catch (e : Exception) {
        _log.info("${lineNumber}: Creation of ER Business Group failed for ${dto}: ${e.Message}")
        rowProcessErrors.add(new RowProcessError(lineNumber, e.Message))
        onFailure()
      }
    }
  }
}