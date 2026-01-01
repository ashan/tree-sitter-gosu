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

class ER_DM_Load_ERParamFundCode {

  public function MigrateERData(csvPath : String) {
    var executor = Executors.newWorkStealingPool(40)
    var inputFile = new File(csvPath+"ERParamFundCode.csv")
    var bulkUploader : ERParamFundCodeBulkUploader
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      bulkUploader = new ERParamFundCodeBulkUploader(inputFile, inputFile.Name, BulkUploadType_ACC.TC_ERDATAMIGRATION)
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

  class ERParamFundCodeBulkUploader extends AbstractBulkUploader {
    construct(uploadFile : File, uploadFileName : String, bulkUploadType : BulkUploadType_ACC) {
      super(uploadFile, uploadFileName, bulkUploadType)
    }
    override protected function getCSVProcessor(bulkUploadType : BulkUploadType_ACC, updater : BulkUploadProcessUpdater, uploadFile : File) : AbstractCSVProcessor {
      return new BulkERParamFundCodeProcessor(new ERParamFundCodeUploadParser(), updater, uploadFile)
    }
  }

  /*--- ER Data Objects ---*/
  class ERParamFundCodeUploadDTO {
    public var erID: Integer as ERID = null
    public var levyApplicationYear: Integer as LevyApplicationYear = null
    public var fundCode: String as FundCode = null
    public var fundName: String as FundName = null
    public var experienceRatingInd: Boolean as ExperienceRatingInd = null

    public override function toString(): String {
      return "ERParamFundCodeUploadDTO{" +
          "erID =" + ERID + '' +
          ", levyApplicationYear =" + levyApplicationYear + '' +
          ", fundCode ='" + fundCode + '\'' +
          ", fundName ='" + fundName + '\'' +
          ", experienceRatingInd =" + experienceRatingInd + '' +
          '}';
    }
  }

  /*--- ER Upload Parsers ---*/
  class ERParamFundCodeUploadParser implements IRowParser<ERParamFundCodeUploadDTO> {
    override function parseRow(csvParser : CSVParser) : Either<List<FieldValidationError>, ERParamFundCodeUploadDTO> {
      try {
        var erID = csvParser.nextString().trim().toOptional()
        var levyApplicationYear = csvParser.nextString().trim().toOptional()
        var fundCode = csvParser.nextString().trim().toOptional()
        var fundName = csvParser.nextString().trim().toOptional()
        var experienceRatingInd = csvParser.nextString().trim().toOptional()

        var parseErrors = verifyPresenceOfMandatoryFields(levyApplicationYear, fundCode, fundName, experienceRatingInd)
        var dto = new ERParamFundCodeUploadDTO()
        erID.each(\value -> {dto.ERID = Integer.valueOf(value)})
        levyApplicationYear.each(\value -> {dto.LevyApplicationYear = Integer.valueOf(value)})
        fundCode.each(\value -> {dto.FundCode = value})
        fundName.each(\value -> {
          dto.FundName = value
        })
        experienceRatingInd.each(\value -> {
          if(Integer.valueOf(value)==1) {
            dto.ExperienceRatingInd = Boolean.TRUE
          } else {
            dto.ExperienceRatingInd = Boolean.FALSE
          }
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
        levyApplicationYear : Optional<String>,
        fundCode : Optional<String>,
        fundName : Optional<String>,
        experienceRatingInd : Optional<String>) : List<FieldValidationError> {

      var errors : LinkedList<FieldValidationError> = {}

      if (!levyApplicationYear.isPresent())
        errors.add(new FieldValidationError("LevyApplicationYear is required"))
      if (!fundCode.isPresent())
        errors.add(new FieldValidationError("FundCode is required"))
      if (!fundName.isPresent())
        errors.add(new FieldValidationError("FundName is required"))
      if (!experienceRatingInd.isPresent())
        errors.add(new FieldValidationError("ExperienceRatingInd is required"))
      return errors
    }
  }

  /*--- ER Upload Processors ---*/
  class BulkERParamFundCodeProcessor extends AbstractCSVProcessor<ERParamFundCodeUploadDTO> {
    construct(rowParser : IRowParser<ERParamFundCodeUploadDTO>, updater : BulkUploadProcessUpdater, uploadFile : File) {
      super(rowParser, updater, uploadFile)
      _log = StructuredLogger.CONFIG.withClass(BulkERParamFundCodeProcessor)
    }

    override function processRows(rows : List<ERParamFundCodeUploadDTO>) : CSVProcessorResult {
      var dataRows = rows
      var rowProcessErrors = new ArrayList<RowProcessError>()
      _log.info("Importing ${dataRows.Count} ERParamFundCodes...")

      for (dataRow in dataRows index i) {
        var rowNumber = i + 1
        var lineNumber = i + 2
        createERParamFundCode(lineNumber, dataRow, rowProcessErrors)
      }
      return new CSVProcessorResult(dataRows.Count - rowProcessErrors.Count, rowProcessErrors)
    }

    private function createERParamFundCode(lineNumber : int, dto : ERParamFundCodeUploadDTO, rowProcessErrors : List<RowProcessError>) {
      try {
        var oEntity : ERParamFundCode_ACC
        gw.transaction.Transaction.runWithNewBundle(\bundle -> {
          oEntity = new ERParamFundCode_ACC()
          oEntity.PublicID = "er:"+dto.ERID
          oEntity.LevyApplicationYear = dto.LevyApplicationYear
          oEntity.FundCode = dto.FundCode
          oEntity.FundName = dto.FundName
          oEntity.ExperienceRatingInd = dto.ExperienceRatingInd
          _log.info("${lineNumber}: Created ER Parameters Claims Fund Code")
        }, "sys")
        onSuccess()
      } catch (e : Exception) {
        _log.info("${lineNumber}: Creation of ER Parameters Claims Fund Code failed for ${dto}: ${e.Message}")
        rowProcessErrors.add(new RowProcessError(lineNumber, e.Message))
        onFailure()
      }
    }
  }
}