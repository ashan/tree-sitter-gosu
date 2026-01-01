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

class ER_DM_Load_ERParamPaymentCode {

  public function MigrateERData(csvPath : String) {
    var executor = Executors.newWorkStealingPool(40)
    var inputFile = new File(csvPath+"ERParamPaymentCode.csv")
    var bulkUploader : ERParamPaymentCodeBulkUploader
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      bulkUploader = new ERParamPaymentCodeBulkUploader(inputFile, inputFile.Name, BulkUploadType_ACC.TC_ERDATAMIGRATION)
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

  class ERParamPaymentCodeBulkUploader extends AbstractBulkUploader {
    construct(uploadFile : File, uploadFileName : String, bulkUploadType : BulkUploadType_ACC) {
      super(uploadFile, uploadFileName, bulkUploadType)
    }
    override protected function getCSVProcessor(bulkUploadType : BulkUploadType_ACC, updater : BulkUploadProcessUpdater, uploadFile : File) : AbstractCSVProcessor {
      return new BulkERParamPaymentCodeProcessor(new ERParamPaymentCodeUploadParser(), updater, uploadFile)
    }
  }

  /*--- ER Data Objects ---*/
  class ERParamPaymentCodeUploadDTO {
    public var erID: Integer as ERID = null
    public var paymentCode: String as PaymentCode = null
    public var paymentDesc: String as PaymentDesc = null
    public var levyPaymentGroup: String as LevyPaymentGroup = null

    public override function toString(): String {
      return "ERParamPaymentCodeUploadDTO{" +
          "erID =" + ERID + '' +
          ", paymentCode ='" + paymentCode + '\'' +
          ", paymentDesc ='" + paymentDesc + '\'' +
          ", levyPaymentGroup ='" + levyPaymentGroup + '\'' +
          '}';
    }
  }

  /*--- ER Upload Parsers ---*/
  class ERParamPaymentCodeUploadParser implements IRowParser<ERParamPaymentCodeUploadDTO> {
    override function parseRow(csvParser : CSVParser) : Either<List<FieldValidationError>, ERParamPaymentCodeUploadDTO> {
      try {
        var erID = csvParser.nextString().trim().toOptional()
        var paymentCode = csvParser.nextString().trim().toOptional()
        var paymentDesc = csvParser.nextString().trim().toOptional()
        var levyPaymentGroup = csvParser.nextString().trim().toOptional()

        var parseErrors = verifyPresenceOfMandatoryFields(paymentCode, paymentDesc, levyPaymentGroup)
        var dto = new ERParamPaymentCodeUploadDTO()
        erID.each(\value -> {dto.ERID = Integer.valueOf(value)})
        paymentCode.each(\value -> {dto.PaymentCode = value})
        paymentDesc.each(\value -> {dto.PaymentDesc = value})
        levyPaymentGroup.each(\value -> {dto.LevyPaymentGroup = value})

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
        paymentCode : Optional<String>,
        paymentDesc : Optional<String>,
        levyPaymentGroup : Optional<String>) : List<FieldValidationError> {
      var errors : LinkedList<FieldValidationError> = {}
      if (!paymentCode.isPresent())
        errors.add(new FieldValidationError("PaymentCode is required"))
      if (!paymentDesc.isPresent())
        errors.add(new FieldValidationError("PaymentDesc is required"))
      if (!levyPaymentGroup.isPresent())
        errors.add(new FieldValidationError("LevyPaymentGroup is required"))
      return errors
    }
  }

  /*--- ER Upload Processors ---*/
  class BulkERParamPaymentCodeProcessor extends AbstractCSVProcessor<ERParamPaymentCodeUploadDTO> {
    construct(rowParser : IRowParser<ERParamPaymentCodeUploadDTO>, updater : BulkUploadProcessUpdater, uploadFile : File) {
      super(rowParser, updater, uploadFile)
      _log = StructuredLogger.CONFIG.withClass(BulkERParamPaymentCodeProcessor)
    }

    override function processRows(rows : List<ERParamPaymentCodeUploadDTO>) : CSVProcessorResult {
      var dataRows = rows
      var rowProcessErrors = new ArrayList<RowProcessError>()
      _log.info("Importing ${dataRows.Count} ERParamPaymentCodes...")

      for (dataRow in dataRows index i) {
        var rowNumber = i + 1
        var lineNumber = i + 2
        createERParamPaymentCode(lineNumber, dataRow, rowProcessErrors)
      }
      return new CSVProcessorResult(dataRows.Count - rowProcessErrors.Count, rowProcessErrors)
    }

    private function createERParamPaymentCode(lineNumber : int, dto : ERParamPaymentCodeUploadDTO, rowProcessErrors : List<RowProcessError>) {
      try {
        var oEntity : ERParamPaymentCode_ACC
        gw.transaction.Transaction.runWithNewBundle(\bundle -> {
          oEntity = new ERParamPaymentCode_ACC()
          oEntity.PublicID = "er:"+dto.ERID
          oEntity.PaymentCode = dto.PaymentCode
          oEntity.PaymentDesc = dto.PaymentDesc
          oEntity.LevyPaymentGroup = dto.LevyPaymentGroup
          _log.info("${lineNumber}: Created ER Parameters Claims Payment Code")
        }, "sys")
        onSuccess()
      } catch (e : Exception) {
        _log.info("${lineNumber}: Creation of ER Parameters Claims Payment Code failed for ${dto}: ${e.Message}")
        rowProcessErrors.add(new RowProcessError(lineNumber, e.Message))
        onFailure()
      }
    }
  }
}