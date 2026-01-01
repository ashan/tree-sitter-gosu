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
uses gw.pl.currency.MonetaryAmount
uses java.math.BigDecimal

class ER_DM_Load_ERParamMinEarnings {

  public function MigrateERData(csvPath : String) {
    var executor = Executors.newWorkStealingPool(40)
    var inputFile = new File(csvPath+"ERParamMinEarnings.csv")
    var bulkUploader : ERParamMinEarningsBulkUploader
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      bulkUploader = new ERParamMinEarningsBulkUploader(inputFile, inputFile.Name, BulkUploadType_ACC.TC_ERDATAMIGRATION)
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

  class ERParamMinEarningsBulkUploader extends AbstractBulkUploader {
    construct(uploadFile : File, uploadFileName : String, bulkUploadType : BulkUploadType_ACC) {
      super(uploadFile, uploadFileName, bulkUploadType)
    }
    override protected function getCSVProcessor(bulkUploadType : BulkUploadType_ACC, updater : BulkUploadProcessUpdater, uploadFile : File) : AbstractCSVProcessor {
      return new BulkERParamMinEarningsProcessor(new ERParamMinEarningsUploadParser(), updater, uploadFile)
    }
  }

  /*--- ER Data Objects ---*/
  class ERParamMinEarningsUploadDTO {
    public var erID: Integer as ERID = null
    public var levyYear: Integer as LevyYear = null
    public var cPFullTimeMinEarnings: MonetaryAmount as CPFullTimeMinEarnings = null
    public var cPXFullTimeMinEarnings: MonetaryAmount as CPXFullTimeMinEarnings = null

    public override function toString(): String {
      return "ERParamMinEarningsUploadDTO{" +
          "erID =" + ERID + '' +
          ", levyYear ='" + levyYear + '\'' +
          ", cPFullTimeMinEarnings ='" + cPFullTimeMinEarnings + '\'' +
          ", cPXFullTimeMinEarnings ='" + cPXFullTimeMinEarnings + '\'' +
          '}';
    }
  }

  /*--- ER Upload Parsers ---*/
  class ERParamMinEarningsUploadParser implements IRowParser<ERParamMinEarningsUploadDTO> {
    override function parseRow(csvParser : CSVParser) : Either<List<FieldValidationError>, ERParamMinEarningsUploadDTO> {
      try {
        var erID = csvParser.nextString().trim().toOptional()
        var levyYear = csvParser.nextString().trim().toOptional()
        var cPFullTimeMinEarnings = csvParser.nextString().trim().toOptional()
        var cPXFullTimeMinEarnings = csvParser.nextString().trim().toOptional()

        var parseErrors = verifyPresenceOfMandatoryFields(levyYear, cPFullTimeMinEarnings, cPXFullTimeMinEarnings)
        var dto = new ERParamMinEarningsUploadDTO()
        erID.each(\value -> {dto.ERID = Integer.valueOf(value)})
        levyYear.each(\value -> {dto.LevyYear = Integer.valueOf(value)})
        cPFullTimeMinEarnings.each(\value -> {dto.CPFullTimeMinEarnings = new BigDecimal(value).toMonetaryAmount()})
        cPXFullTimeMinEarnings.each(\value -> {dto.CPXFullTimeMinEarnings = new BigDecimal(value).toMonetaryAmount()})

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
        levyYear : Optional<String>,
        cPFullTimeMinEarnings : Optional<String>,
        cPXFullTimeMinEarnings : Optional<String>) : List<FieldValidationError> {
      var errors : LinkedList<FieldValidationError> = {}
      if (!levyYear.isPresent())
        errors.add(new FieldValidationError("LevyYear is required"))
      if (!cPFullTimeMinEarnings.isPresent())
        errors.add(new FieldValidationError("CPFullTimeMinEarnings is required"))
      if (!cPXFullTimeMinEarnings.isPresent())
        errors.add(new FieldValidationError("CPXFullTimeMinEarnings is required"))
      return errors
    }
  }

  /*--- ER Upload Processors ---*/
  class BulkERParamMinEarningsProcessor extends AbstractCSVProcessor<ERParamMinEarningsUploadDTO> {
    construct(rowParser : IRowParser<ERParamMinEarningsUploadDTO>, updater : BulkUploadProcessUpdater, uploadFile : File) {
      super(rowParser, updater, uploadFile)
      _log = StructuredLogger.CONFIG.withClass(BulkERParamMinEarningsProcessor)
    }

    override function processRows(rows : List<ERParamMinEarningsUploadDTO>) : CSVProcessorResult {
      var dataRows = rows
      var rowProcessErrors = new ArrayList<RowProcessError>()
      _log.info("Importing ${dataRows.Count} ERParamMinEarningss...")

      for (dataRow in dataRows index i) {
        var rowNumber = i + 1
        var lineNumber = i + 2
        createERParamMinEarnings(lineNumber, dataRow, rowProcessErrors)
      }
      return new CSVProcessorResult(dataRows.Count - rowProcessErrors.Count, rowProcessErrors)
    }

    private function createERParamMinEarnings(lineNumber : int, dto : ERParamMinEarningsUploadDTO, rowProcessErrors : List<RowProcessError>) {
      try {
        var oEntity : ERParamMinEarnings_ACC
        gw.transaction.Transaction.runWithNewBundle(\bundle -> {
          oEntity = new ERParamMinEarnings_ACC()
          oEntity.PublicID = "er:"+dto.ERID
          oEntity.LevyYear = dto.LevyYear
          oEntity.CPFullTimeMinEarnings = dto.CPFullTimeMinEarnings
          oEntity.CPXFullTimeMinEarnings = dto.CPXFullTimeMinEarnings
          _log.info("${lineNumber}: Created ER Parameters Claims Injury Code")
        }, "sys")
        onSuccess()
      } catch (e : Exception) {
        _log.info("${lineNumber}: Creation of ER Parameters Claims Injury Code failed for ${dto}: ${e.Message}")
        rowProcessErrors.add(new RowProcessError(lineNumber, e.Message))
        onFailure()
      }
    }
  }
}