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

class ER_DM_Load_ERParamLRG {
  public function MigrateERData(csvPath : String) {
    var executor = Executors.newWorkStealingPool(40)
    var inputFile = new File(csvPath+"ERParamLRG.csv")
    var bulkUploader : ERParamLRGBulkUploader
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      bulkUploader = new ERParamLRGBulkUploader(inputFile, inputFile.Name, BulkUploadType_ACC.TC_ERDATAMIGRATION)
    })
    try {
      executor.submit(\-> bulkUploader.run())
    } catch (e : Exception) {
      print("Bulk uploader can not be scheduled for execution: "+e)
    }
    //shutdown ExecutorService
    executor.shutdown();
    while (!executor.isTerminated()) {   }
    System.out.println("Finished all ERParamLRG threads");
  }

  class ERParamLRGBulkUploader extends AbstractBulkUploader {
    construct(uploadFile : File, uploadFileName : String, bulkUploadType : BulkUploadType_ACC) {
      super(uploadFile, uploadFileName, bulkUploadType)
    }
    override protected function getCSVProcessor(bulkUploadType : BulkUploadType_ACC, updater : BulkUploadProcessUpdater, uploadFile : File) : AbstractCSVProcessor {
      return new BulkERParamLRGProcessor(new ERParamLRGUploadParser(), updater, uploadFile)
    }
  }

  /*--- ER Data Objects ---*/
  class ERParamLRGUploadDTO {
    public var erID: Integer as ERID = null
    public var levyApplicationYear: Integer as LevyApplicationYear = null
    public var lrgCode: Integer as LRGCode = null
    public var lrgDesc: String as LRGDesc = null

    public override function toString(): String {
      return "ERParamLRGUploadDTO{" +
          "erID =" + ERID + '' +
          ", levyApplicationYear =" + levyApplicationYear + '' +
          ", lrgCode ='" + lrgCode + '\'' +
          ", lrgDesc ='" + lrgDesc + '\'' +
          '}';
    }
  }

  /*--- ER Upload Parsers ---*/
  class ERParamLRGUploadParser implements IRowParser<ERParamLRGUploadDTO> {
    override function parseRow(csvParser : CSVParser) : Either<List<FieldValidationError>, ERParamLRGUploadDTO> {
      try {
        var erID = csvParser.nextString().trim().toOptional()
        var levyApplicationYear = csvParser.nextString().trim().toOptional()
        var lrgCode = csvParser.nextString().trim().toOptional()
        var lrgDesc = csvParser.nextString().trim().toOptional()

        var parseErrors = verifyPresenceOfMandatoryFields(levyApplicationYear, lrgCode, lrgDesc)
        var dto = new ERParamLRGUploadDTO()
        erID.each(\value -> {dto.ERID = Integer.valueOf(value)})
        levyApplicationYear.each(\value -> {dto.LevyApplicationYear = Integer.valueOf(value)})
        lrgCode.each(\value -> {dto.LRGCode = Integer.valueOf(value)})
        lrgDesc.each(\value -> {dto.LRGDesc = value})

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
        levyApplicationYear : Optional<String>,
        lrgCode : Optional<String>,
        lrgDesc : Optional<String>) : List<FieldValidationError> {

      var errors : LinkedList<FieldValidationError> = {}

      if (!levyApplicationYear.isPresent())
        errors.add(new FieldValidationError("LevyApplicationYear is required"))
      if (!lrgCode.isPresent())
        errors.add(new FieldValidationError("LRGCode is required"))
      if (!lrgDesc.isPresent())
        errors.add(new FieldValidationError("LRGDesc is required"))
      return errors
    }
  }

  /*--- ER Upload Processors ---*/
  class BulkERParamLRGProcessor extends AbstractCSVProcessor<ERParamLRGUploadDTO> {
    construct(rowParser : IRowParser<ERParamLRGUploadDTO>, updater : BulkUploadProcessUpdater, uploadFile : File) {
      super(rowParser, updater, uploadFile)
      _log = StructuredLogger.CONFIG.withClass(BulkERParamLRGProcessor)
    }

    override function processRows(rows : List<ERParamLRGUploadDTO>) : CSVProcessorResult {
      var dataRows = rows
      var rowProcessErrors = new ArrayList<RowProcessError>()
      _log.info("Importing ${dataRows.Count} ERParamLRGs...")

      for (dataRow in dataRows index i) {
        var rowNumber = i + 1
        var lineNumber = i + 2
        createERParamLRG(lineNumber, dataRow, rowProcessErrors)
      }
      return new CSVProcessorResult(dataRows.Count - rowProcessErrors.Count, rowProcessErrors)
    }

    private function createERParamLRG(lineNumber : int, dto : ERParamLRGUploadDTO, rowProcessErrors : List<RowProcessError>) {
      try {
        var oEntity : ERParamLRG_ACC
        gw.transaction.Transaction.runWithNewBundle(\bundle -> {
          oEntity = new ERParamLRG_ACC()
          oEntity.PublicID = "er:"+dto.ERID
          oEntity.LevyApplicationYear = dto.LevyApplicationYear
          oEntity.LRGCode = dto.LRGCode
          oEntity.LRGDesc = dto.LRGDesc
          _log.info("${lineNumber}: Created ER Parameters LRGCode")
        }, "sys")
        onSuccess()
      } catch (e : Exception) {
        _log.info("${lineNumber}: Creation of ER Parameters LRGCode failed for ${dto}: ${e.Message}")
        rowProcessErrors.add(new RowProcessError(lineNumber, e.Message))
        onFailure()
      }
    }
  }
}