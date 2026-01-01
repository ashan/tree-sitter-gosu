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

class ER_DM_Load_ERParamInjuryCategory {

  public function MigrateERData(csvPath : String) {
    var executor = Executors.newWorkStealingPool(40)
    var inputFile = new File(csvPath+"ERParamInjuryCategory.csv")
    var bulkUploader : ERParamInjuryCategoryBulkUploader
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      bulkUploader = new ERParamInjuryCategoryBulkUploader(inputFile, inputFile.Name, BulkUploadType_ACC.TC_ERDATAMIGRATION)
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

  class ERParamInjuryCategoryBulkUploader extends AbstractBulkUploader {
    construct(uploadFile : File, uploadFileName : String, bulkUploadType : BulkUploadType_ACC) {
      super(uploadFile, uploadFileName, bulkUploadType)
    }
    override protected function getCSVProcessor(bulkUploadType : BulkUploadType_ACC, updater : BulkUploadProcessUpdater, uploadFile : File) : AbstractCSVProcessor {
      return new BulkERParamInjuryCategoryProcessor(new ERParamInjuryCategoryUploadParser(), updater, uploadFile)
    }
  }

  /*--- ER Data Objects ---*/
  class ERParamInjuryCategoryUploadDTO {
    public var erID: Integer as ERID = null
    public var levyApplicationYear: Integer as LevyApplicationYear = null
    public var injuryCategory: String as InjuryCategory = null
    public var experienceRatingInd: Boolean as ExperienceRatingInd = null

    public override function toString(): String {
      return "ERParamInjuryCategoryUploadDTO{" +
          "erID =" + ERID + '' +
          ", levyApplicationYear ='" + levyApplicationYear + '\'' +
          ", injuryCategory ='" + injuryCategory + '\'' +
          ", experienceRatingInd ='" + experienceRatingInd + '\'' +
          '}';
    }
  }

  /*--- ER Upload Parsers ---*/
  class ERParamInjuryCategoryUploadParser implements IRowParser<ERParamInjuryCategoryUploadDTO> {
    override function parseRow(csvParser : CSVParser) : Either<List<FieldValidationError>, ERParamInjuryCategoryUploadDTO> {
      try {
        var erID = csvParser.nextString().trim().toOptional()
        var levyApplicationYear = csvParser.nextString().trim().toOptional()
        var injuryCategory = csvParser.nextString().trim().toOptional()
        var experienceRatingInd = csvParser.nextString().trim().toOptional()

        var parseErrors = verifyPresenceOfMandatoryFields(levyApplicationYear, injuryCategory, experienceRatingInd)
        var dto = new ERParamInjuryCategoryUploadDTO()
        erID.each(\value -> {dto.ERID = Integer.valueOf(value)})
        levyApplicationYear.each(\value -> {dto.LevyApplicationYear = Integer.valueOf(value)})
        injuryCategory.each(\value -> {dto.InjuryCategory = value})
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
        injuryCategory : Optional<String>,
        experienceRatingInd : Optional<String>) : List<FieldValidationError> {

      var errors : LinkedList<FieldValidationError> = {}

      if (!levyApplicationYear.isPresent())
        errors.add(new FieldValidationError("LevyApplicationYear is required"))
      if (!injuryCategory.isPresent())
        errors.add(new FieldValidationError("InjuryCategory is required"))
      if (!experienceRatingInd.isPresent())
        errors.add(new FieldValidationError("ExperienceRatingInd is required"))
      return errors
    }
  }

  /*--- ER Upload Processors ---*/
  class BulkERParamInjuryCategoryProcessor extends AbstractCSVProcessor<ERParamInjuryCategoryUploadDTO> {
    construct(rowParser : IRowParser<ERParamInjuryCategoryUploadDTO>, updater : BulkUploadProcessUpdater, uploadFile : File) {
      super(rowParser, updater, uploadFile)
      _log = StructuredLogger.CONFIG.withClass(BulkERParamInjuryCategoryProcessor)
    }

    override function processRows(rows : List<ERParamInjuryCategoryUploadDTO>) : CSVProcessorResult {
      var dataRows = rows
      var rowProcessErrors = new ArrayList<RowProcessError>()
      _log.info("Importing ${dataRows.Count} ERParamInjuryCategorys...")

      for (dataRow in dataRows index i) {
        var rowNumber = i + 1
        var lineNumber = i + 2
        createERParamInjuryCategory(lineNumber, dataRow, rowProcessErrors)
      }
      return new CSVProcessorResult(dataRows.Count - rowProcessErrors.Count, rowProcessErrors)
    }

    private function createERParamInjuryCategory(lineNumber : int, dto : ERParamInjuryCategoryUploadDTO, rowProcessErrors : List<RowProcessError>) {
      try {
        var oEntity : ERParamInjuryCategory_ACC
        gw.transaction.Transaction.runWithNewBundle(\bundle -> {
          oEntity = new ERParamInjuryCategory_ACC()
          oEntity.PublicID = "er:"+dto.ERID
          oEntity.LevyApplicationYear = dto.LevyApplicationYear
          oEntity.InjuryCategory = dto.InjuryCategory
          oEntity.ExperienceRatingInd = dto.ExperienceRatingInd
          _log.info("${lineNumber}: Created ER Parameters Claims Injury Category")
        }, "sys")
        onSuccess()
      } catch (e : Exception) {
        _log.info("${lineNumber}: Creation of ER Parameters Claims Injury Category failed for ${dto}: ${e.Message}")
        rowProcessErrors.add(new RowProcessError(lineNumber, e.Message))
        onFailure()
      }
    }
  }
}