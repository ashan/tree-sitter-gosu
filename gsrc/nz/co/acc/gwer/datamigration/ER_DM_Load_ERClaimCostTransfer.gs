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

class ER_DM_Load_ERClaimCostTransfer {

  public function MigrateERData(csvPath : String) {
    var executor = Executors.newWorkStealingPool(40)
    var inputFile = new File(csvPath+"ERClaimCostTransfer.csv")
    var bulkUploader : ERClaimCostTransferBulkUploader
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      bulkUploader = new ERClaimCostTransferBulkUploader(inputFile, inputFile.Name, BulkUploadType_ACC.TC_ERDATAMIGRATION)
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

  class ERClaimCostTransferBulkUploader extends AbstractBulkUploader {
    construct(uploadFile : File, uploadFileName : String, bulkUploadType : BulkUploadType_ACC) {
      super(uploadFile, uploadFileName, bulkUploadType)
    }
    override protected function getCSVProcessor(bulkUploadType : BulkUploadType_ACC, updater : BulkUploadProcessUpdater, uploadFile : File) : AbstractCSVProcessor {
      return new BulkERClaimCostTransferProcessor(new ERClaimCostTransferUploadParser(), updater, uploadFile)
    }
  }

  /*--- ER Data Objects ---*/
  class ERClaimCostTransferUploadDTO {
    public var erID: Integer as ERID = null
    public var sourceClaim: String as SourceClaim = null
    public var destinationClaim: String as DestinationClaim = null
    public var effectivePeriodStart: Date as EffectivePeriodStart = null
    public var effectivePeriodEnd: Date as EffectivePeriodEnd = null
    public var description: String as Description = null
    public var createTime: Date as CreateTime = null
    public var createUser: String as CreateUser = null
    public var updateTime: Date as UpdateTime = null
    public var updateUser: String as UpdateUser = null

    public override function toString(): String {
      return "ERClaimCostTransferUploadDTO{" +
          "erID =" + erID + '' +
          ", sourceClaim ='" + sourceClaim + '\'' +
          ", destinationClaim ='" + destinationClaim + '\'' +
          ", effectivePeriodStart ='" + effectivePeriodStart + '\'' +
          ", effectivePeriodEnd ='" + effectivePeriodEnd + '\'' +
          ", description ='" + description + '\'' +
          ", createTime ='" + createTime + '\'' +
          ", createUser ='" + createUser + '\'' +
          ", updateTime ='" + updateTime + '\'' +
          ", updateUser ='" + updateUser + '\'' +
          '}';
    }
  }

  /*--- ER Upload Parsers ---*/
  class ERClaimCostTransferUploadParser implements IRowParser<ERClaimCostTransferUploadDTO> {
    private final var dateParser = new DateParser()
    override function parseRow(csvParser : CSVParser) : Either<List<FieldValidationError>, ERClaimCostTransferUploadDTO> {
      try {
        var erID = csvParser.nextString().trim().toOptional()
        var sourceClaim = csvParser.nextString().trim().toOptional()
        var destinationClaim = csvParser.nextString().trim().toOptional()
        var effectivePeriodStart = csvParser.nextString().trim().toOptional()
        var effectivePeriodEnd = csvParser.nextString().trim().toOptional()
        var description = csvParser.nextString().trim().toOptional()
        var createTime = csvParser.nextString().trim().toOptional()
        var createUser = csvParser.nextString().trim().toOptional()
        var updateTime = csvParser.nextString().trim().toOptional()
        var updateUser = csvParser.nextString().trim().toOptional()

        var parseErrors = verifyPresenceOfMandatoryFields(sourceClaim, destinationClaim, effectivePeriodStart, effectivePeriodEnd, description)
        var dto = new ERClaimCostTransferUploadDTO()
        erID.each(\value -> {dto.ERID = Integer.valueOf(value)})

        sourceClaim.each(\value -> {dto.SourceClaim = value})
        destinationClaim.each(\value -> {dto.DestinationClaim = value})
        parseField(parseErrors, dateParser, effectivePeriodStart,
            \parsedResult -> {dto.EffectivePeriodStart = parsedResult})
        parseField(parseErrors, dateParser, effectivePeriodEnd,
            \parsedResult -> {dto.EffectivePeriodEnd = parsedResult})
        description.each(\value -> {dto.Description = value})
        parseField(parseErrors, dateParser, createTime,
            \parsedResult -> {
              dto.CreateTime = parsedResult
            })
        createUser.each(\value -> {
          dto.CreateUser = value
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
        sourceClaim : Optional<String>,
        destinationClaim : Optional<String>,
        effectivePeriodStart : Optional<String>,
        effectivePeriodEnd : Optional<String>,
        description : Optional<String>) : List<FieldValidationError> {
      var errors : LinkedList<FieldValidationError> = {}
      if (!sourceClaim.isPresent())
        errors.add(new FieldValidationError("SourceClaim is required"))
      if (!destinationClaim.isPresent())
        errors.add(new FieldValidationError("DestinationClaim is required"))
      if (!effectivePeriodStart.isPresent())
        errors.add(new FieldValidationError("EffectivePeriodStart is required"))
      if (!effectivePeriodEnd.isPresent())
        errors.add(new FieldValidationError("EffectivePeriodEnd is required"))
      if (!description.isPresent())
        errors.add(new FieldValidationError("Description is required"))
      return errors
    }
  }

  /*--- ER Upload Processors ---*/
  class BulkERClaimCostTransferProcessor extends AbstractCSVProcessor<ERClaimCostTransferUploadDTO> {
    construct(rowParser : IRowParser<ERClaimCostTransferUploadDTO>, updater : BulkUploadProcessUpdater, uploadFile : File) {
      super(rowParser, updater, uploadFile)
      _log = StructuredLogger.CONFIG.withClass(BulkERClaimCostTransferProcessor)
    }

    override function processRows(rows : List<ERClaimCostTransferUploadDTO>) : CSVProcessorResult {
      var dataRows = rows
      var rowProcessErrors = new ArrayList<RowProcessError>()
      _log.info("Importing ${dataRows.Count} ERClaimCostTransfers...")

      for (dataRow in dataRows index i) {
        var rowNumber = i + 1
        var lineNumber = i + 2
        createERClaimCostTransfer(lineNumber, dataRow, rowProcessErrors)
      }
      return new CSVProcessorResult(dataRows.Count - rowProcessErrors.Count, rowProcessErrors)
    }

    private function createERClaimCostTransfer(lineNumber : int, dto : ERClaimCostTransferUploadDTO, rowProcessErrors : List<RowProcessError>) {
      try {
        var oEntity : ERClaimCostTransfer_ACC
        gw.transaction.Transaction.runWithNewBundle(\bundle -> {
          oEntity = new ERClaimCostTransfer_ACC()
          oEntity.PublicID = "er:"+dto.ERID
          oEntity.SourceClaim = dto.SourceClaim
          oEntity.DestinationClaim = dto.DestinationClaim
          oEntity.EffectivePeriodStart = dto.EffectivePeriodStart
          oEntity.EffectivePeriodEnd = dto.EffectivePeriodEnd
          oEntity.Description = dto.Description
          _log.info("${lineNumber}: Created ER Claim Cost Transfer")
        }, "sys")
        onSuccess()
      } catch (e : Exception) {
        _log.info("${lineNumber}: Creation of ER Claim Cost Transfer failed for ${dto}: ${e.Message}")
        rowProcessErrors.add(new RowProcessError(lineNumber, e.Message))
        onFailure()
      }
    }
  }
}