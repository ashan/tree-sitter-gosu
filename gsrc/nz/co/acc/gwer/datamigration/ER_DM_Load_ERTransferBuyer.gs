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

class ER_DM_Load_ERTransferBuyer {

  public function MigrateERData(csvPath : String) {
    var executor = Executors.newWorkStealingPool(40)
    var inputFile = new File(csvPath+"ERTransferBuyer.csv")
    var bulkUploader : ERTransferBuyerBulkUploader
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      bulkUploader = new ERTransferBuyerBulkUploader(inputFile, inputFile.Name, BulkUploadType_ACC.TC_ERDATAMIGRATION)
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

  class ERTransferBuyerBulkUploader extends AbstractBulkUploader {
    construct(uploadFile : File, uploadFileName : String, bulkUploadType : BulkUploadType_ACC) {
      super(uploadFile, uploadFileName, bulkUploadType)
    }
    override protected function getCSVProcessor(bulkUploadType : BulkUploadType_ACC, updater : BulkUploadProcessUpdater, uploadFile : File) : AbstractCSVProcessor {
      return new BulkERTransferBuyerProcessor(new ERTransferBuyerUploadParser(), updater, uploadFile)
    }
  }

  /*--- ER Data Objects ---*/
  class ERTransferBuyerUploadDTO {
    public var erID: Integer as ERID = null
    public var transferID: Integer as TransferID = null
    public var aCCPolicyID: String as ACCPolicyID = null
    public var createTime: Date as CreateTime = null
    public var createUser: String as CreateUser = null
    public var createEmail: String as CreateEmail = null
    public var updateTime: Date as UpdateTime = null
    public var updateUser: String as UpdateUser = null

    public override function toString(): String {
      return "ERTransferBuyerUploadDTO{" +
          "erID =" + erID + '' +
          ", transferID ='" + transferID + '\'' +
          ", aCCPolicyID ='" + aCCPolicyID + '\'' +
          ", createTime ='" + createTime + '\'' +
          ", createUser ='" + createUser + '\'' +
          ", createEmail ='" + createEmail + '\'' +
          ", updateTime ='" + updateTime + '\'' +
          ", updateUser ='" + updateUser + '\'' +
          '}';
    }
  }

  /*--- ER Upload Parsers ---*/
  class ERTransferBuyerUploadParser implements IRowParser<ERTransferBuyerUploadDTO> {
    private final var dateParser = new DateParser()
    override function parseRow(csvParser : CSVParser) : Either<List<FieldValidationError>, ERTransferBuyerUploadDTO> {
      try {
        var erID = csvParser.nextString().trim().toOptional()
        var transferID = csvParser.nextString().trim().toOptional()
        var aCCPolicyID = csvParser.nextString().trim().toOptional()
        var createTime = csvParser.nextString().trim().toOptional()
        var createUser = csvParser.nextString().trim().toOptional()
        var createEmail = csvParser.nextString().trim().toOptional()
        var updateTime = csvParser.nextString().trim().toOptional()
        var updateUser = csvParser.nextString().trim().toOptional()

        var parseErrors = verifyPresenceOfMandatoryFields(transferID, aCCPolicyID)
        var dto = new ERTransferBuyerUploadDTO()
        erID.each(\value -> {dto.ERID = Integer.valueOf(value)})
        transferID.each(\value -> {dto.TransferID = Integer.valueOf(value)})
        aCCPolicyID.each(\value -> {dto.ACCPolicyID = value})
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
        transferID : Optional<String>,
        aCCPolicyID : Optional<String>) : List<FieldValidationError> {
      var errors : LinkedList<FieldValidationError> = {}
      if (!transferID.isPresent())
        errors.add(new FieldValidationError("TransferID is required"))
      if (!aCCPolicyID.isPresent())
        errors.add(new FieldValidationError("ACCPolicyID is required"))
      return errors
    }
  }

  /*--- ER Upload Processors ---*/
  class BulkERTransferBuyerProcessor extends AbstractCSVProcessor<ERTransferBuyerUploadDTO> {
    construct(rowParser : IRowParser<ERTransferBuyerUploadDTO>, updater : BulkUploadProcessUpdater, uploadFile : File) {
      super(rowParser, updater, uploadFile)
      _log = StructuredLogger.CONFIG.withClass(BulkERTransferBuyerProcessor)
    }

    override function processRows(rows : List<ERTransferBuyerUploadDTO>) : CSVProcessorResult {
      var dataRows = rows
      var rowProcessErrors = new ArrayList<RowProcessError>()
      _log.info("Importing ${dataRows.Count} ERTransferBuyers...")

      for (dataRow in dataRows index i) {
        var rowNumber = i + 1
        var lineNumber = i + 2
        createERTransferBuyer(lineNumber, dataRow, rowProcessErrors)
      }
      return new CSVProcessorResult(dataRows.Count - rowProcessErrors.Count, rowProcessErrors)
    }

    private function createERTransferBuyer(lineNumber : int, dto : ERTransferBuyerUploadDTO, rowProcessErrors : List<RowProcessError>) {
      try {
        var oEntity : ERTransferBuyer_ACC
        gw.transaction.Transaction.runWithNewBundle(\bundle -> {
          oEntity = new ERTransferBuyer_ACC()
          oEntity.PublicID = "er:"+dto.ERID
          if(dto.TransferID != null) {
            var oERTransfer = getERTransfer("er:" + dto.TransferID)
            if(oERTransfer != null)
              oEntity.ERTransfer = oERTransfer
          }
          oEntity.ACCPolicyID_ACC = dto.ACCPolicyID
          _log.info("${lineNumber}: Created ER Transfer Buyer")
        }, "sys")
        onSuccess()
      } catch (e : Exception) {
        _log.info("${lineNumber}: Creation of ER Transfer Buyer failed for ${dto}: ${e.Message}")
        rowProcessErrors.add(new RowProcessError(lineNumber, e.Message))
        onFailure()
      }
    }
    private function getERTransfer(publicID : String) : ERTransfer_ACC {
      return Query.make(ERTransfer_ACC)
          .compareIgnoreCase(ERTransfer_ACC#PublicID, Relop.Equals, publicID)
          .select().AtMostOneRow
    }
  }
}