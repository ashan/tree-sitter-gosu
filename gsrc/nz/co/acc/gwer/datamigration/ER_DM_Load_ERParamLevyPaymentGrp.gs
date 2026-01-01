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

class ER_DM_Load_ERParamLevyPaymentGrp {

  public function MigrateERData(csvPath : String) {
    var executor = Executors.newWorkStealingPool(40)
    var inputFile = new File(csvPath+"ERParamLevyPaymentGrp.csv")
    var bulkUploader : ERParamLevyPaymentGrpBulkUploader
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      bulkUploader = new ERParamLevyPaymentGrpBulkUploader(inputFile, inputFile.Name, BulkUploadType_ACC.TC_ERDATAMIGRATION)
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

  class ERParamLevyPaymentGrpBulkUploader extends AbstractBulkUploader {
    construct(uploadFile : File, uploadFileName : String, bulkUploadType : BulkUploadType_ACC) {
      super(uploadFile, uploadFileName, bulkUploadType)
    }
    override protected function getCSVProcessor(bulkUploadType : BulkUploadType_ACC, updater : BulkUploadProcessUpdater, uploadFile : File) : AbstractCSVProcessor {
      return new BulkERParamLevyPaymentGrpProcessor(new ERParamLevyPaymentGrpUploadParser(), updater, uploadFile)
    }
  }

  /*--- ER Data Objects ---*/
  class ERParamLevyPaymentGrpUploadDTO {
    public var erID: Integer as ERID = null
    public var levyApplicationYear: Integer as LevyApplicationYear = null
    public var levyPaymentGroup: String as LevyPaymentGroup = null
    public var riskMgmtInd: Boolean as RiskMgmtInd = null
    public var rehabMgmtInd: Boolean as RehabMgmtInd = null

    public override function toString(): String {
      return "ERParamLevyPaymentGrpUploadDTO{" +
          "erID =" + ERID + '' +
          ", levyApplicationYear ='" + levyApplicationYear + '\'' +
          ", levyPaymentGroup ='" + levyPaymentGroup + '\'' +
          ", riskMgmtInd ='" + riskMgmtInd + '\'' +
          ", rehabMgmtInd ='" + rehabMgmtInd + '\'' +
          '}';
    }
  }

  /*--- ER Upload Parsers ---*/
  class ERParamLevyPaymentGrpUploadParser implements IRowParser<ERParamLevyPaymentGrpUploadDTO> {
    override function parseRow(csvParser : CSVParser) : Either<List<FieldValidationError>, ERParamLevyPaymentGrpUploadDTO> {
      try {
        var erID = csvParser.nextString().trim().toOptional()
        var levyApplicationYear = csvParser.nextString().trim().toOptional()
        var levyPaymentGroup = csvParser.nextString().trim().toOptional()
        var riskMgmtInd = csvParser.nextString().trim().toOptional()
        var rehabMgmtInd = csvParser.nextString().trim().toOptional()

        var parseErrors = verifyPresenceOfMandatoryFields(levyApplicationYear, levyPaymentGroup, riskMgmtInd, rehabMgmtInd)
        var dto = new ERParamLevyPaymentGrpUploadDTO()
        erID.each(\value -> {dto.ERID = Integer.valueOf(value)})
        levyApplicationYear.each(\value -> {dto.LevyApplicationYear = Integer.valueOf(value)})
        levyPaymentGroup.each(\value -> {dto.LevyPaymentGroup = value})
        riskMgmtInd.each(\value -> {
          if(Integer.valueOf(value)==1) {
            dto.RiskMgmtInd = Boolean.TRUE
          } else {
            dto.RiskMgmtInd = Boolean.FALSE
          }
        })
        rehabMgmtInd.each(\value -> {
          if(Integer.valueOf(value)==1) {
            dto.RehabMgmtInd = Boolean.TRUE
          } else {
            dto.RehabMgmtInd = Boolean.FALSE
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
        levyPaymentGroup : Optional<String>,
        riskMgmtInd : Optional<String>,
        rehabMgmtInd : Optional<String>) : List<FieldValidationError> {
      var errors : LinkedList<FieldValidationError> = {}
      if (!levyApplicationYear.isPresent())
        errors.add(new FieldValidationError("LevyApplicationYear is required"))
      if (!levyPaymentGroup.isPresent())
        errors.add(new FieldValidationError("LevyPaymentGroup is required"))
      if (!riskMgmtInd.isPresent())
        errors.add(new FieldValidationError("RiskMgmtInd is required"))
      if (!rehabMgmtInd.isPresent())
        errors.add(new FieldValidationError("RehabMgmtInd is required"))
      return errors
    }
  }

  /*--- ER Upload Processors ---*/
  class BulkERParamLevyPaymentGrpProcessor extends AbstractCSVProcessor<ERParamLevyPaymentGrpUploadDTO> {
    construct(rowParser : IRowParser<ERParamLevyPaymentGrpUploadDTO>, updater : BulkUploadProcessUpdater, uploadFile : File) {
      super(rowParser, updater, uploadFile)
      _log = StructuredLogger.CONFIG.withClass(BulkERParamLevyPaymentGrpProcessor)
    }

    override function processRows(rows : List<ERParamLevyPaymentGrpUploadDTO>) : CSVProcessorResult {
      var dataRows = rows
      var rowProcessErrors = new ArrayList<RowProcessError>()
      _log.info("Importing ${dataRows.Count} ERParamLevyPaymentGrps...")

      for (dataRow in dataRows index i) {
        var rowNumber = i + 1
        var lineNumber = i + 2
        createERParamLevyPaymentGrp(lineNumber, dataRow, rowProcessErrors)
      }
      return new CSVProcessorResult(dataRows.Count - rowProcessErrors.Count, rowProcessErrors)
    }

    private function createERParamLevyPaymentGrp(lineNumber : int, dto : ERParamLevyPaymentGrpUploadDTO, rowProcessErrors : List<RowProcessError>) {
      try {
        var oEntity : ERParamLevyPaymentGrp_ACC
        gw.transaction.Transaction.runWithNewBundle(\bundle -> {
          oEntity = new ERParamLevyPaymentGrp_ACC()
          oEntity.PublicID = "er:"+dto.ERID
          oEntity.LevyApplicationYear = dto.LevyApplicationYear
          oEntity.LevyPaymentGroup = dto.LevyPaymentGroup
          oEntity.RiskMgmtInd = dto.RiskMgmtInd
          oEntity.RehabMgmtInd = dto.RehabMgmtInd
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