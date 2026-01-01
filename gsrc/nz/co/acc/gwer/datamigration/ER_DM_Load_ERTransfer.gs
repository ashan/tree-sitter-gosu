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

class ER_DM_Load_ERTransfer {

  public function MigrateERData(csvPath : String) {
    var executor = Executors.newWorkStealingPool(40)
    var inputFile = new File(csvPath+"ERTransfer.csv")
    var bulkUploader : ERTransferBulkUploader
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      bulkUploader = new ERTransferBulkUploader(inputFile, inputFile.Name, BulkUploadType_ACC.TC_ERDATAMIGRATION)
    })
    try {
      executor.submit(\-> bulkUploader.run())
    } catch (e : Exception) {
      print("Bulk uploader can not be scheduled for execution: "+e)
    }
    //shutdown ExecutorService
    executor.shutdown();
    while (!executor.isTerminated()) {   }
    System.out.println("Finished all ERTransfer threads");
  }

  class ERTransferBulkUploader extends AbstractBulkUploader {
    construct(uploadFile : File, uploadFileName : String, bulkUploadType : BulkUploadType_ACC) {
      super(uploadFile, uploadFileName, bulkUploadType)
    }
    override protected function getCSVProcessor(bulkUploadType : BulkUploadType_ACC, updater : BulkUploadProcessUpdater, uploadFile : File) : AbstractCSVProcessor {
      return new BulkERTransferProcessor(new ERTransferUploadParser(), updater, uploadFile)
    }
  }

  /*--- ER Data Objects ---*/
  class ERTransferUploadDTO {
    public var erID: Integer as ERID = null
    public var transferID: Integer as TransferID = null
    public var transferType: ERTransferType_ACC as TransferType = null
    public var transferDate: Date as TransferDate = null
    public var transferStartDate: Date as TransferStartDate = null
    public var transferStatus: ERTransferStatus_ACC as TransferStatus = null
    public var sellerACCPolicyID: String as SellerACCPolicyID = null
    public var createTime: Date as CreateTime = null
    public var createUser: String as CreateUser = null
    public var createEmail: String as CreateEmail = null
    public var updateTime: Date as UpdateTime = null
    public var updateUser: String as UpdateUser = null
    public var updateEmail: String as UpdateEmail = null

    public override function toString(): String {
      return "ERTransferUploadDTO{" +
          "erID =" + erID + '' +
          ", transferID =" + transferID + '' +
          ", transferType ='" + transferType + '\'' +
          ", transferDate ='" + transferDate + '\'' +
          ", transferStartDate ='" + transferStartDate + '\'' +
          ", transferStatus ='" + transferStatus + '\'' +
          ", sellerACCPolicyID ='" + sellerACCPolicyID + '\'' +
          ", createTime ='" + createTime + '\'' +
          ", createUser ='" + createUser + '\'' +
          ", createEmail ='" + createEmail + '\'' +
          ", updateTime ='" + updateTime + '\'' +
          ", updateUser ='" + updateUser + '\'' +
          ", updateEmail ='" + updateEmail + '\'' +
          '}';
    }
  }

  /*--- ER Upload Parsers ---*/
  class ERTransferTypeParser implements IFieldParser<ERTransferType_ACC> {
    override function parse(text: String): Either<FieldValidationError, ERTransferType_ACC> {
      var oTypeItem = ERTransferType_ACC.get(text)
      if (oTypeItem == null) {
        return Either.left(new FieldValidationError("Invalid ER Transfer Type: ${text}"))
      } else {
        return Either.right(oTypeItem)
      }
    }
  }
  class ERTransferStatusParser implements IFieldParser<ERTransferStatus_ACC> {
    override function parse(text: String): Either<FieldValidationError, ERTransferStatus_ACC> {
      var oTypeItem = ERTransferStatus_ACC.get(text)
      if (oTypeItem == null) {
        return Either.left(new FieldValidationError("Invalid ER Transfer Status: ${text}"))
      } else {
        return Either.right(oTypeItem)
      }
    }
  }

  class ERTransferUploadParser implements IRowParser<ERTransferUploadDTO> {
    private final var dateParser = new DateParser()
    private final var erTransferTypeParser = new ERTransferTypeParser()
    private final var erTransferStatusParser = new ERTransferStatusParser()

    override function parseRow(csvParser : CSVParser) : Either<List<FieldValidationError>, ERTransferUploadDTO> {
      try {
        var erID = csvParser.nextString().trim().toOptional()
        var transferID = csvParser.nextString().trim().toOptional()
        var transferType = csvParser.nextString().trim().toOptional()
        var transferDate = csvParser.nextString().trim().toOptional()
        var transferStartDate = csvParser.nextString().trim().toOptional()
        var transferStatus = csvParser.nextString().trim().toOptional()
        var sellerACCPolicyID = csvParser.nextString().trim().toOptional()
        var createTime = csvParser.nextString().trim().toOptional()
        var createUser = csvParser.nextString().trim().toOptional()
        var createEmail = csvParser.nextString().trim().toOptional()
        var updateTime = csvParser.nextString().trim().toOptional()
        var updateUser = csvParser.nextString().trim().toOptional()
        var updateEmail = csvParser.nextString().trim().toOptional()

        var parseErrors = verifyPresenceOfMandatoryFields(transferID, transferType, transferDate,
            transferStartDate, transferStatus, sellerACCPolicyID)
        var dto = new ERTransferUploadDTO()
        erID.each(\value -> {dto.ERID = Integer.valueOf(value)})

        transferID.each(\value -> {dto.TransferID = Integer.valueOf(value)})
        parseField(parseErrors, erTransferTypeParser, transferType,
            \parsedResult -> {dto.TransferType = parsedResult})
        parseField(parseErrors, dateParser, transferDate,
            \parsedResult -> {dto.TransferDate = parsedResult})
        parseField(parseErrors, dateParser, transferStartDate,
            \parsedResult -> {dto.TransferStartDate = parsedResult})
        parseField(parseErrors, erTransferStatusParser, transferStatus,
            \parsedResult -> {dto.TransferStatus = parsedResult})
        sellerACCPolicyID.each(\value -> {dto.SellerACCPolicyID = value})
        parseField(parseErrors, dateParser, createTime,
            \parsedResult -> {dto.CreateTime = parsedResult})
        createUser.each(\value -> {dto.CreateUser = value})
        createEmail.each(\value -> {dto.CreateEmail = value})
        parseField(parseErrors, dateParser, updateTime,
            \parsedResult -> {dto.UpdateTime = parsedResult})
        updateUser.each(\value -> {dto.UpdateUser = value})
        updateEmail.each(\value -> {dto.UpdateEmail = value})

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
        transferID : Optional<String>,
        transferType : Optional<String>,
        transferDate : Optional<String>,
        transferStartDate : Optional<String>,
        transferStatus : Optional<String>,
        sellerACCPolicyID : Optional<String>) : List<FieldValidationError> {
      var errors : LinkedList<FieldValidationError> = {}
      if (!transferID.isPresent())
        errors.add(new FieldValidationError("TransferID is required"))
      if (!transferType.isPresent())
        errors.add(new FieldValidationError("TransferType is required"))
      if (!transferDate.isPresent())
        errors.add(new FieldValidationError("TransferDate is required"))
      if (!transferStartDate.isPresent())
        errors.add(new FieldValidationError("TransferStartDate is required"))
      if (!transferStatus.isPresent())
        errors.add(new FieldValidationError("TransferStatus is required"))
      if (!sellerACCPolicyID.isPresent())
        errors.add(new FieldValidationError("SellerACCPolicyID is required"))
      return errors
    }
  }

  /*--- ER Upload Processors ---*/
  class BulkERTransferProcessor extends AbstractCSVProcessor<ERTransferUploadDTO> {
    construct(rowParser : IRowParser<ERTransferUploadDTO>, updater : BulkUploadProcessUpdater, uploadFile : File) {
      super(rowParser, updater, uploadFile)
      _log = StructuredLogger.CONFIG.withClass(BulkERTransferProcessor)
    }

    override function processRows(rows : List<ERTransferUploadDTO>) : CSVProcessorResult {
      var dataRows = rows
      var rowProcessErrors = new ArrayList<RowProcessError>()
      _log.info("Importing ${dataRows.Count} ERTransfers...")

      for (dataRow in dataRows index i) {
        var rowNumber = i + 1
        var lineNumber = i + 2
        createERTransfer(lineNumber, dataRow, rowProcessErrors)
      }
      return new CSVProcessorResult(dataRows.Count - rowProcessErrors.Count, rowProcessErrors)
    }

    private function createERTransfer(lineNumber : int, dto : ERTransferUploadDTO, rowProcessErrors : List<RowProcessError>) {
      try {
        var oEntity : ERTransfer_ACC
        gw.transaction.Transaction.runWithNewBundle(\bundle -> {
          oEntity = new ERTransfer_ACC()
          oEntity.PublicID = "er:"+dto.TransferID
          oEntity.ERTransferType = dto.TransferType
          oEntity.TransferDate = dto.TransferDate
          oEntity.TransferStartDate = dto.TransferStartDate
          oEntity.ERTransferStatus = dto.TransferStatus
          oEntity.SellerACCPolicyID = dto.SellerACCPolicyID
          _log.info("${lineNumber}: Created ER Transfer")
        }, "sys")
        onSuccess()
      } catch (e : Exception) {
        _log.info("${lineNumber}: Creation of ER Transfer failed for ${dto}: ${e.Message}")
        rowProcessErrors.add(new RowProcessError(lineNumber, e.Message))
        onFailure()
      }
    }
  }
}