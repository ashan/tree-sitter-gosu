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

class ER_DM_Load_ERRequest {
  public function MigrateERData(csvPath : String) {
    var executor = Executors.newWorkStealingPool(40)
    var inputFile = new File(csvPath+"ERRequest.csv")
    var bulkUploader : ERRequestBulkUploader
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      bulkUploader = new ERRequestBulkUploader(inputFile, inputFile.Name, BulkUploadType_ACC.TC_ERDATAMIGRATION)
    })
    try {
      executor.submit(\-> bulkUploader.run())
    } catch (e : Exception) {
      print("Bulk uploader can not be scheduled for execution: "+e)
    }
    //shutdown ExecutorService
    executor.shutdown();
    while (!executor.isTerminated()) {   }
    System.out.println("Finished all ERRequest threads");
  }

  class ERRequestBulkUploader extends AbstractBulkUploader {
    construct(uploadFile : File, uploadFileName : String, bulkUploadType : BulkUploadType_ACC) {
      super(uploadFile, uploadFileName, bulkUploadType)
    }
    override protected function getCSVProcessor(bulkUploadType : BulkUploadType_ACC, updater : BulkUploadProcessUpdater, uploadFile : File) : AbstractCSVProcessor {
      return new BulkERRequestProcessor(new ERRequestUploadParser(), updater, uploadFile)
    }
  }

  /*--- ER Data Objects ---*/
  class ERRequestUploadDTO {
    public var erID: Integer as ERID = null
    public var requestID: Integer as RequestID = null
    public var levyYear: Integer as LevyYear = null
    public var requestType: ERRequestType_ACC as RequestType = null
    public var requestGroupType: ERRequestGroupType_ACC as RequestGroupType = null
    public var requestDecision: ERRequestDecision_ACC as RequestDecision = null
    public var requestStatus: ERRequestStatus_ACC as RequestStatus = null
    public var requestDecisionDetail: String as RequestDecisionDetail = null
    public var requestRatesSource: ERRequestRatesSource_ACC as RequestRatesSource = null
    public var ratesApprovedDate: Date as RatesApprovedDate = null
    public var ratesApproverUser: User as RatesApproverUser = null
    public var createTime: Date as CreateTime = null
    public var createUser: String as CreateUser = null
    public var createEmail: String as CreateEmail = null
    public var updateTime: Date as UpdateTime = null
    public var updateUser: String as UpdateUser = null

    public override function toString(): String {
      return "ERRequestUploadDTO{" +
          "erID =" + erID + '' +
          ", requestID =" + requestID + '' +
          ", levyYear =" + levyYear + '' +
          ", requestType ='" + requestType + '\'' +
          ", requestGroupType ='" + requestGroupType + '\'' +
          ", requestDecision ='" + requestDecision + '\'' +
          ", requestStatus ='" + requestStatus + '\'' +
          ", requestDecisionDetail ='" + requestDecisionDetail + '\'' +
          ", requestRatesSource ='" + requestRatesSource + '\'' +
          ", ratesApprovedDate ='" + ratesApprovedDate + '\'' +
          ", ratesApproverUser ='" + ratesApproverUser + '\'' +
          ", createTime ='" + createTime + '\'' +
          ", createUser ='" + createUser + '\'' +
          ", createEmail ='" + createEmail + '\'' +
          ", updateTime ='" + updateTime + '\'' +
          ", updateUser ='" + updateUser + '\'' +
          '}';
    }
  }

  /*--- ER Upload Parsers ---*/
  class ERRequestTypeParser implements IFieldParser<ERRequestType_ACC> {
    override function parse(text: String): Either<FieldValidationError, ERRequestType_ACC> {
      var oTypeItem = ERRequestType_ACC.get(text)
      if (oTypeItem == null) {
        return Either.left(new FieldValidationError("Invalid ER Request Type: ${text}"))
      } else {
        return Either.right(oTypeItem)
      }
    }
  }
  class ERRequestGroupTypeParser implements IFieldParser<ERRequestGroupType_ACC> {
    override function parse(text: String): Either<FieldValidationError, ERRequestGroupType_ACC> {
      var oTypeItem = ERRequestGroupType_ACC.get(text)
      if (oTypeItem == null) {
        return Either.left(new FieldValidationError("Invalid ER Request Group Type: ${text}"))
      } else {
        return Either.right(oTypeItem)
      }
    }
  }
  class ERRequestDecisionParser implements IFieldParser<ERRequestDecision_ACC> {
    override function parse(text: String): Either<FieldValidationError, ERRequestDecision_ACC> {
      var oTypeItem = ERRequestDecision_ACC.get(text)
      if (oTypeItem == null) {
        return Either.left(new FieldValidationError("Invalid ER Request Decision: ${text}"))
      } else {
        return Either.right(oTypeItem)
      }
    }
  }
  class ERRequestStatusParser implements IFieldParser<ERRequestStatus_ACC> {
    override function parse(text: String): Either<FieldValidationError, ERRequestStatus_ACC> {
      var oTypeItem = ERRequestStatus_ACC.get(text)
      if (oTypeItem == null) {
        return Either.left(new FieldValidationError("Invalid ER Request Status: ${text}"))
      } else {
        return Either.right(oTypeItem)
      }
    }
  }
  class ERRequestRatesSourceParser implements IFieldParser<ERRequestRatesSource_ACC> {
    override function parse(text: String): Either<FieldValidationError, ERRequestRatesSource_ACC> {
      var oTypeItem = ERRequestRatesSource_ACC.get(text)
      if (oTypeItem == null) {
        return Either.left(new FieldValidationError("Invalid ER Request Rates Source: ${text}"))
      } else {
        return Either.right(oTypeItem)
      }
    }
  }

  class ERRequestUploadParser implements IRowParser<ERRequestUploadDTO> {
    private final var dateParser = new DateParser()
    private final var erRequestTypeParser = new ERRequestTypeParser()
    private final var erRequestGroupTypeParser = new ERRequestGroupTypeParser()
    private final var erRequestDecisionParser = new ERRequestDecisionParser()
    private final var erRequestStatusParser = new ERRequestStatusParser()
    private final var erRequestRatesSourceParser = new ERRequestRatesSourceParser()

    override function parseRow(csvParser : CSVParser) : Either<List<FieldValidationError>, ERRequestUploadDTO> {
      try {
        var erID = csvParser.nextString().trim().toOptional()
        var requestID = csvParser.nextString().trim().toOptional()
        var levyYear = csvParser.nextString().trim().toOptional()
        var requestType = csvParser.nextString().trim().toOptional()
        var requestGroupType = csvParser.nextString().trim().toOptional()
        var requestDecision = csvParser.nextString().trim().toOptional()
        var requestStatus = csvParser.nextString().trim().toOptional()
        var requestDecisionDetail = csvParser.nextString().trim().toOptional()
        var requestRatesSource = csvParser.nextString().trim().toOptional()
        var ratesApprovedDate = csvParser.nextString().trim().toOptional()
        var ratesApproverUser = csvParser.nextString().trim().toOptional()
        var createTime = csvParser.nextString().trim().toOptional()
        var createUser = csvParser.nextString().trim().toOptional()
        var createEmail = csvParser.nextString().trim().toOptional()
        var updateTime = csvParser.nextString().trim().toOptional()
        var updateUser = csvParser.nextString().trim().toOptional()

        var parseErrors = verifyPresenceOfMandatoryFields(requestID, levyYear, requestType, requestGroupType)
        var dto = new ERRequestUploadDTO()
        erID.each(\value -> {dto.ERID = Integer.valueOf(value)})
        requestID.each(\value -> {dto.RequestID = Integer.valueOf(value)})
        levyYear.each(\value -> {dto.LevyYear = Integer.valueOf(value)})
        parseField(parseErrors, erRequestTypeParser, requestType,
            \parsedResult -> {dto.RequestType = parsedResult})
        parseField(parseErrors, erRequestGroupTypeParser, requestGroupType,
            \parsedResult -> {dto.RequestGroupType = parsedResult})
        parseField(parseErrors, erRequestDecisionParser, requestDecision,
            \parsedResult -> {dto.RequestDecision = parsedResult})
        parseField(parseErrors, erRequestStatusParser, requestStatus,
            \parsedResult -> {dto.RequestStatus = parsedResult})
        requestDecisionDetail.each(\value -> {dto.RequestDecisionDetail = value})
//        parseField(parseErrors, erRequestRatesSourceParser, requestRatesSource,
//            \parsedResult -> {dto.RequestRatesSource = parsedResult})
//        parseField(parseErrors, dateParser, ratesApprovedDate,
//            \parsedResult -> {dto.RatesApprovedDate = parsedResult})
//        ratesApproverUser.each(\value -> {dto.RatesApproverUser = value})

        parseField(parseErrors, dateParser, createTime,
            \parsedResult -> {
              dto.CreateTime = parsedResult
            })
        createUser.each(\value -> {
          dto.CreateUser = value
        })
        createEmail.each(\value -> {
          dto.CreateEmail = value
        })
        parseField(parseErrors, dateParser, updateTime,
            \parsedResult -> {
              dto.UpdateTime = parsedResult
            })
        updateUser.each(\value -> {
          dto.UpdateUser = value
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
        requestID : Optional<String>,
        levyYear : Optional<String>,
        requestType : Optional<String>,
        requestGroupType : Optional<String>) : List<FieldValidationError> {
      var errors : LinkedList<FieldValidationError> = {}
      if (!requestID.isPresent())
        errors.add(new FieldValidationError("RequestID is required"))
      if (!levyYear.isPresent())
        errors.add(new FieldValidationError("LevyYear is required"))
      if (!requestType.isPresent())
        errors.add(new FieldValidationError("RequestType is required"))
      if (!requestGroupType.isPresent())
        errors.add(new FieldValidationError("RequestGroupType is required"))
      return errors
    }
  }

  /*--- ER Upload Processors ---*/
  class BulkERRequestProcessor extends AbstractCSVProcessor<ERRequestUploadDTO> {
    construct(rowParser : IRowParser<ERRequestUploadDTO>, updater : BulkUploadProcessUpdater, uploadFile : File) {
      super(rowParser, updater, uploadFile)
      _log = StructuredLogger.CONFIG.withClass(BulkERRequestProcessor)
    }

    override function processRows(rows : List<ERRequestUploadDTO>) : CSVProcessorResult {
      var dataRows = rows
      var rowProcessErrors = new ArrayList<RowProcessError>()
      _log.info("Importing ${dataRows.Count} ERRequests...")

      for (dataRow in dataRows index i) {
        var rowNumber = i + 1
        var lineNumber = i + 2
        createERRequest(lineNumber, dataRow, rowProcessErrors)
      }
      return new CSVProcessorResult(dataRows.Count - rowProcessErrors.Count, rowProcessErrors)
    }

    private function createERRequest(lineNumber : int, dto : ERRequestUploadDTO, rowProcessErrors : List<RowProcessError>) {
      try {
        var oEntity : ERRequest_ACC
        gw.transaction.Transaction.runWithNewBundle(\bundle -> {
          oEntity = new ERRequest_ACC()
          oEntity.PublicID = "er:"+dto.RequestID
          oEntity.LevyYear = dto.LevyYear
          oEntity.ERRequestType = dto.RequestType
          oEntity.ERRequestGroupType = dto.RequestGroupType
          oEntity.ERRequestDecision = dto.RequestDecision
          oEntity.ERRequestStatus = dto.RequestStatus
          oEntity.RequestDecisionDetail = dto.RequestDecisionDetail
//          oEntity.ERRequestRatesSource = dto.RequestRatesSource
//          oEntity.RatesApprovedDate = dto.RatesApprovedDate
//          if(dto.RatesApproverUser != null) {
//            var oUser = getUser(dto.RatesApproverUser)
//            if(oUser != null)
//              oEntity.RatesApproverUser = oUser
//          }
          _log.info("${lineNumber}: Created ER Request")
        }, "sys")
        onSuccess()
      } catch (e : Exception) {
        _log.info("${lineNumber}: Creation of ER Request failed for ${dto}: ${e.Message}")
        rowProcessErrors.add(new RowProcessError(lineNumber, e.Message))
        onFailure()
      }
    }
    private function getUser(userName : String) : User {
      return Query.make(User)
          .join("Credential").compareIgnoreCase(Credential#UserName, Relop.Equals, userName)
          .select().AtMostOneRow
    }
  }
}