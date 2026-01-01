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

class ER_DM_Load_ERAEPExit {

  public function MigrateERData(csvPath : String) {
    var executor = Executors.newWorkStealingPool(40)
    var inputFile = new File(csvPath+"ERAEPExit.csv")
    var bulkUploader : ERAEPExitBulkUploader
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      bulkUploader = new ERAEPExitBulkUploader(inputFile, inputFile.Name, BulkUploadType_ACC.TC_ERDATAMIGRATION)
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

  class ERAEPExitBulkUploader extends AbstractBulkUploader {
    construct(uploadFile : File, uploadFileName : String, bulkUploadType : BulkUploadType_ACC) {
      super(uploadFile, uploadFileName, bulkUploadType)
    }
    override protected function getCSVProcessor(bulkUploadType : BulkUploadType_ACC, updater : BulkUploadProcessUpdater, uploadFile : File) : AbstractCSVProcessor {
      return new BulkERAEPExitProcessor(new ERAEPExitUploadParser(), updater, uploadFile)
    }
  }

  /*--- ER Data Objects ---*/
  class ERAEPExitUploadDTO {
    public var erID: Integer as ERID = null
    public var accPolicyID_ACC: String as ACCPolicyID_ACC = null
    public var levyApplicationYear: Integer as LevyApplicationYear = null

    public override function toString(): String {
      return "ERAEPExitUploadDTO{" +
          "erID ='" + ERID + '\'' +
          ", accPolicyID_ACC ='" + accPolicyID_ACC + '\'' +
          ", levyApplicationYear =" + levyApplicationYear + '' +
          '}';
    }
  }

  /*--- ER Upload Parsers ---*/
  class ERAEPExitUploadParser implements IRowParser<ERAEPExitUploadDTO> {
    private final var dateParser = new DateParser()

    override function parseRow(csvParser : CSVParser) : Either<List<FieldValidationError>, ERAEPExitUploadDTO> {
      try {
        var erID = csvParser.nextString().trim().toOptional()
        var accPolicyID_ACC = csvParser.nextString().trim().toOptional()
        var levyApplicationYear = csvParser.nextString().trim().toOptional()

        var parseErrors = verifyPresenceOfMandatoryFields(accPolicyID_ACC, levyApplicationYear)
        var dto = new ERAEPExitUploadDTO()
        erID.each(\value -> {dto.ERID = Integer.valueOf(value)})
        accPolicyID_ACC.each(\value -> {dto.ACCPolicyID_ACC = value})
        levyApplicationYear.each(\value -> {dto.LevyApplicationYear = Integer.valueOf(value)})

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
        accPolicyID_ACC : Optional<String>,
        levyApplicationYear : Optional<String>) : List<FieldValidationError> {

      var errors : LinkedList<FieldValidationError> = {}

      if (!accPolicyID_ACC.isPresent()) {
        errors.add(new FieldValidationError("ACCPolicyID_ACC is required"))
      }
      if (!levyApplicationYear.isPresent()) {
        errors.add(new FieldValidationError("LevyApplicationYear is required"))
      }
      return errors
    }
  }

  /*--- ER Upload Processors ---*/
  class BulkERAEPExitProcessor extends AbstractCSVProcessor<ERAEPExitUploadDTO> {
    construct(rowParser : IRowParser<ERAEPExitUploadDTO>, updater : BulkUploadProcessUpdater, uploadFile : File) {
      super(rowParser, updater, uploadFile)
      _log = StructuredLogger.CONFIG.withClass(BulkERAEPExitProcessor)
    }

    override function processRows(rows : List<ERAEPExitUploadDTO>) : CSVProcessorResult {
      var ERAEPExits = rows
      var rowProcessErrors = new ArrayList<RowProcessError>()
      _log.info("Importing ${ERAEPExits.Count} ERAEPExits...")

      for (ERAEPExit in ERAEPExits index i) {
        var rowNumber = i + 1
        var lineNumber = i + 2
        createERAEPExit(lineNumber, ERAEPExit, rowProcessErrors)
      }
      return new CSVProcessorResult(ERAEPExits.Count - rowProcessErrors.Count, rowProcessErrors)
    }

    private function createERAEPExit(lineNumber : int, dto : ERAEPExitUploadDTO, rowProcessErrors : List<RowProcessError>) {
      try {
        var oEntity : ERAEPExits_ACC
        gw.transaction.Transaction.runWithNewBundle(\bundle -> {
          oEntity = new ERAEPExits_ACC()
          oEntity.PublicID = "er:"+dto.ERID
          oEntity.ACCNumber = dto.ACCPolicyID_ACC
          oEntity.LevyApplicationYear = dto.LevyApplicationYear
          _log.info("${lineNumber}: Created ER AEP Exit")
        }, "sys")
        onSuccess()
      } catch (e : Exception) {
        _log.info("${lineNumber}: Creation of ER AEP Exit failed for ${dto}: ${e.Message}")
        rowProcessErrors.add(new RowProcessError(lineNumber, e.Message))
        onFailure()
      }
    }
  }
}