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

class ER_DM_Load_ERRequestTargetEntity {

  public function MigrateERData(csvPath : String) {
    var executor = Executors.newWorkStealingPool(40)
    var inputFile = new File(csvPath+"ERRequestTarget.csv")
    var bulkUploader : ERRequestTargetEntityBulkUploader
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      bulkUploader = new ERRequestTargetEntityBulkUploader(inputFile, inputFile.Name, BulkUploadType_ACC.TC_ERDATAMIGRATION)
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

  class ERRequestTargetEntityBulkUploader extends AbstractBulkUploader {
    construct(uploadFile : File, uploadFileName : String, bulkUploadType : BulkUploadType_ACC) {
      super(uploadFile, uploadFileName, bulkUploadType)
    }
    override protected function getCSVProcessor(bulkUploadType : BulkUploadType_ACC, updater : BulkUploadProcessUpdater, uploadFile : File) : AbstractCSVProcessor {
      return new BulkERRequestTargetEntityProcessor(new ERRequestTargetEntityUploadParser(), updater, uploadFile)
    }
  }

  /*--- ER Data Objects ---*/
  class ERRequestTargetEntityUploadDTO {
    public var erID: Integer as ERID = null
    public var requestID: Integer as RequestID = null
    public var businessGroupID: String as BusinessGroupID = null
    public var accPolicyID_ACC: String as ACCPolicyID_ACC = null
    public var name: String as Name = null
    public var requestReason: ERRequestReason_ACC as ERRequestReason = null
    public var requestReasonDetail: String as RequestReasonDetail = null

    public override function toString(): String {
      return "ERRequestTargetEntityUploadDTO{" +
          "erID =" + erID + '' +
          ", requestID =" + requestID + '' +
          ", businessGroupID ='" + businessGroupID + '\'' +
          ", accPolicyID_ACC ='" + accPolicyID_ACC + '\'' +
          ", name ='" + name + '\'' +
          ", requestReason ='" + requestReason + '\'' +
          ", requestReasonDetail ='" + requestReasonDetail + '\'' +
          '}';
    }
  }

  /*--- ER Upload Parsers ---*/
  class ERRequestReasonParser implements IFieldParser<ERRequestReason_ACC> {
    override function parse(text: String): Either<FieldValidationError, ERRequestReason_ACC> {
      var oTypeItem = ERRequestReason_ACC.get(text)
      if (oTypeItem == null) {
        return Either.left(new FieldValidationError("Invalid ER Request Reason: ${text}"))
      } else {
        return Either.right(oTypeItem)
      }
    }
  }

  class ERRequestTargetEntityUploadParser implements IRowParser<ERRequestTargetEntityUploadDTO> {
    private final var dateParser = new DateParser()
    private final var erRequestReasonParser = new ERRequestReasonParser()

    override function parseRow(csvParser : CSVParser) : Either<List<FieldValidationError>, ERRequestTargetEntityUploadDTO> {
      try {
        var erID = csvParser.nextString().trim().toOptional()
        var requestID = csvParser.nextString().trim().toOptional()
        var businessGroupID = csvParser.nextString().trim().toOptional()
        var accPolicyID_ACC = csvParser.nextString().trim().toOptional()
        var name = csvParser.nextString().trim().toOptional()
        var requestReason = csvParser.nextString().trim().toOptional()
        var requestReasonDetail = csvParser.nextString().trim().toOptional()

        var parseErrors = verifyPresenceOfMandatoryFields(requestID, businessGroupID, accPolicyID_ACC)
        var dto = new ERRequestTargetEntityUploadDTO()
        erID.each(\value -> {dto.ERID = Integer.valueOf(value)})
        requestID.each(\value -> {dto.RequestID = Integer.valueOf(value)})
        businessGroupID.each(\value -> {dto.BusinessGroupID = value})
        accPolicyID_ACC.each(\value -> {dto.ACCPolicyID_ACC = value})
        name.each(\value -> {dto.Name = value})
        parseField(parseErrors, erRequestReasonParser, requestReason,
            \parsedResult -> {dto.ERRequestReason = parsedResult})
        requestReasonDetail.each(\value -> {dto.RequestReasonDetail = value})

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
        requestID : Optional<String>,
        businessGroupID : Optional<String>,
        accPolicyID_ACC : Optional<String>) : List<FieldValidationError> {
      var errors : LinkedList<FieldValidationError> = {}
      if (!requestID.isPresent())
        errors.add(new FieldValidationError("RequestID is required"))
      if (!businessGroupID.isPresent() and !accPolicyID_ACC.isPresent() )
        errors.add(new FieldValidationError("Either BusinessGroupID or ACCPolicyID is required"))
      return errors
    }
  }

  /*--- ER Upload Processors ---*/
  class BulkERRequestTargetEntityProcessor extends AbstractCSVProcessor<ERRequestTargetEntityUploadDTO> {
    construct(rowParser : IRowParser<ERRequestTargetEntityUploadDTO>, updater : BulkUploadProcessUpdater, uploadFile : File) {
      super(rowParser, updater, uploadFile)
      _log = StructuredLogger.CONFIG.withClass(BulkERRequestTargetEntityProcessor)
    }

    override function processRows(rows : List<ERRequestTargetEntityUploadDTO>) : CSVProcessorResult {
      var dataRows = rows
      var rowProcessErrors = new ArrayList<RowProcessError>()
      _log.info("Importing ${dataRows.Count} ERRunTargetEntities...")

      for (dataRow in dataRows index i) {
        var rowNumber = i + 1
        var lineNumber = i + 2
        createERRequestTargetEntity(lineNumber, dataRow, rowProcessErrors)
      }
      return new CSVProcessorResult(dataRows.Count - rowProcessErrors.Count, rowProcessErrors)
    }

    private function createERRequestTargetEntity(lineNumber : int, dto : ERRequestTargetEntityUploadDTO, rowProcessErrors : List<RowProcessError>) {
      try {
        var oEntity : ERRequestTargetEntity_ACC
        gw.transaction.Transaction.runWithNewBundle(\bundle -> {
          oEntity = new ERRequestTargetEntity_ACC()
          oEntity.PublicID = "er:"+dto.ERID
          if(dto.RequestID != null) {
            var oERRequest = getERRequest("er:" + dto.RequestID)
            if(oERRequest != null)
              oEntity.ERRequest = oERRequest
          }
          if(dto.BusinessGroupID != null) {
            var oERBusinessGroup = getERBusinessGroup("er:" + dto.BusinessGroupID)
            if(oERBusinessGroup != null)
              oEntity.ERBusinessGroup = oERBusinessGroup
          }
          oEntity.ACCPolicyID_ACC = dto.ACCPolicyID_ACC
          oEntity.Name = dto.Name
          oEntity.ERRequestReason = dto.ERRequestReason
          oEntity.RequestReasonDetail = dto.RequestReasonDetail
          _log.info("${lineNumber}: Created ER Request Target")
        }, "sys")
        onSuccess()
      } catch (e : Exception) {
        _log.info("${lineNumber}: Creation of ER Request Target failed for ${dto}: ${e.Message}")
        rowProcessErrors.add(new RowProcessError(lineNumber, e.Message))
        onFailure()
      }
    }
    private function getERRequest(publicID : String) : ERRequest_ACC {
      return Query.make(ERRequest_ACC)
          .compareIgnoreCase(ERRequest_ACC#PublicID, Relop.Equals, publicID)
          .select().AtMostOneRow
    }
    private function getERBusinessGroup(businessGroupID : String) : ERBusinessGroup_ACC {
      return Query.make(ERBusinessGroup_ACC)
          .compareIgnoreCase(ERBusinessGroup_ACC#BusinessGroupID, Relop.Equals, businessGroupID)
          .select().AtMostOneRow
    }
  }
}