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

class ER_DM_Load_ERDocumentSubType {

  public function MigrateERData(csvPath : String) {
    var executor = Executors.newWorkStealingPool(40)
    var inputFile = new File(csvPath+"ERDocumentSubType.csv")
    var bulkUploader : ERDocumentSubTypeBulkUploader
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      bulkUploader = new ERDocumentSubTypeBulkUploader(inputFile, inputFile.Name, BulkUploadType_ACC.TC_ERDATAMIGRATION)
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

  class ERDocumentSubTypeBulkUploader extends AbstractBulkUploader {
    construct(uploadFile : File, uploadFileName : String, bulkUploadType : BulkUploadType_ACC) {
      super(uploadFile, uploadFileName, bulkUploadType)
    }
    override protected function getCSVProcessor(bulkUploadType : BulkUploadType_ACC, updater : BulkUploadProcessUpdater, uploadFile : File) : AbstractCSVProcessor {
      return new BulkERDocumentSubTypeProcessor(new ERDocumentSubTypeUploadParser(), updater, uploadFile)
    }
  }

  /*--- ER Data Objects ---*/
  class ERDocumentSubTypeUploadDTO {
    public var erID: Integer as ERID = null
    public var documentSubType: String as DocumentSubType = null
    public var displayName: String as DisplayName = null
    public var sortOrder: Integer as SortOrder = null
    public var documentType: ERDocumentType_ACC as DocumentType = null

    public override function toString(): String {
      return "ERDocumentSubTypeUploadDTO{" +
          "erID =" + erID + '' +
          ", documentSubType ='" + documentSubType + '\'' +
          ", displayName ='" + displayName + '\'' +
          ", sortOrder ='" + sortOrder + '\'' +
          ", documentType ='" + documentType + '\'' +
          '}';
    }
  }

  /*--- ER Upload Parsers ---*/
  class ERDocumentTypeParser implements IFieldParser<ERDocumentType_ACC> {
    override function parse(text: String): Either<FieldValidationError, ERDocumentType_ACC> {
      var oTypeItem = ERDocumentType_ACC.get(text)
      if (oTypeItem == null) {
        return Either.left(new FieldValidationError("Invalid ER Document Type: ${text}"))
      } else {
        return Either.right(oTypeItem)
      }
    }
  }

  class ERDocumentSubTypeUploadParser implements IRowParser<ERDocumentSubTypeUploadDTO> {
    private final var erDocumentTypeParser = new ERDocumentTypeParser()
    override function parseRow(csvParser : CSVParser) : Either<List<FieldValidationError>, ERDocumentSubTypeUploadDTO> {
      try {
        var erID = csvParser.nextString().trim().toOptional()
        var documentSubType = csvParser.nextString().trim().toOptional()
        var displayName = csvParser.nextString().trim().toOptional()
        var sortOrder = csvParser.nextString().trim().toOptional()
        var documentType = csvParser.nextString().trim().toOptional()

        var parseErrors = verifyPresenceOfMandatoryFields(documentSubType, displayName, sortOrder, documentType)
        var dto = new ERDocumentSubTypeUploadDTO()
        erID.each(\value -> {dto.ERID = Integer.valueOf(value)})
        documentSubType.each(\value -> {dto.DocumentSubType = value})
        displayName.each(\value -> {dto.DisplayName = value})
        sortOrder.each(\value -> {dto.SortOrder = Integer.valueOf(value)})
        parseField(parseErrors, erDocumentTypeParser, documentType,
            \parsedResult -> {dto.DocumentType = parsedResult})

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
        documentSubType : Optional<String>,
        displayName : Optional<String>,
        sortOrder : Optional<String>,
        documentType : Optional<String>) : List<FieldValidationError> {
      var errors : LinkedList<FieldValidationError> = {}
      if (!documentSubType.isPresent())
        errors.add(new FieldValidationError("DocumentSubType is required"))
      if (!displayName.isPresent())
        errors.add(new FieldValidationError("DisplayName is required"))
      if (!sortOrder.isPresent())
        errors.add(new FieldValidationError("SortOrder is required"))
      if (!documentType.isPresent())
        errors.add(new FieldValidationError("DocumentType is required"))
      return errors
    }
  }

  /*--- ER Upload Processors ---*/
  class BulkERDocumentSubTypeProcessor extends AbstractCSVProcessor<ERDocumentSubTypeUploadDTO> {
    construct(rowParser : IRowParser<ERDocumentSubTypeUploadDTO>, updater : BulkUploadProcessUpdater, uploadFile : File) {
      super(rowParser, updater, uploadFile)
      _log = StructuredLogger.CONFIG.withClass(BulkERDocumentSubTypeProcessor)
    }

    override function processRows(rows : List<ERDocumentSubTypeUploadDTO>) : CSVProcessorResult {
      var dataRows = rows
      var rowProcessErrors = new ArrayList<RowProcessError>()
      _log.info("Importing ${dataRows.Count} ERDocumentSubTypes...")

      for (dataRow in dataRows index i) {
        var rowNumber = i + 1
        var lineNumber = i + 2
        createERDocumentSubType(lineNumber, dataRow, rowProcessErrors)
      }
      return new CSVProcessorResult(dataRows.Count - rowProcessErrors.Count, rowProcessErrors)
    }

    private function createERDocumentSubType(lineNumber : int, dto : ERDocumentSubTypeUploadDTO, rowProcessErrors : List<RowProcessError>) {
      try {
        var oEntity : ERDocumentSubType_ACC
        gw.transaction.Transaction.runWithNewBundle(\bundle -> {
          oEntity = new ERDocumentSubType_ACC()
          oEntity.PublicID = "er:"+dto.ERID
          oEntity.DocumentSubType = dto.DocumentSubType
          oEntity.DisplayName = dto.DisplayName
          oEntity.SortOrder = dto.SortOrder
          oEntity.ERDocumentType = dto.DocumentType
          _log.info("${lineNumber}: Created ER Document Sub Type")
        }, "sys")
        onSuccess()
      } catch (e : Exception) {
        _log.info("${lineNumber}: Creation of ER Document Sub Type failed for ${dto}: ${e.Message}")
        rowProcessErrors.add(new RowProcessError(lineNumber, e.Message))
        onFailure()
      }
    }
  }
}