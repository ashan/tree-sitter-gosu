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
uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.pl.util.csv.CSVParser
uses edge.util.either.Either

uses java.util.concurrent.Executors
uses java.io.File

class ER_DM_Load_ERLRGParametersValue {

  public function MigrateERData(csvPath : String) {
    var executor = Executors.newWorkStealingPool(40)
    var inputFile = new File(csvPath+"ERLRGParametersValue.csv")
    var bulkUploader : ERLRGParametersValueBulkUploader
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      bulkUploader = new ERLRGParametersValueBulkUploader(inputFile, inputFile.Name, BulkUploadType_ACC.TC_ERDATAMIGRATION)
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

  class ERLRGParametersValueBulkUploader extends AbstractBulkUploader {
    construct(uploadFile : File, uploadFileName : String, bulkUploadType : BulkUploadType_ACC) {
      super(uploadFile, uploadFileName, bulkUploadType)
    }
    override protected function getCSVProcessor(bulkUploadType : BulkUploadType_ACC, updater : BulkUploadProcessUpdater, uploadFile : File) : AbstractCSVProcessor {
      return new BulkERLRGParametersValueProcessor(new ERLRGParametersValueUploadParser(), updater, uploadFile)
    }
  }

  /*--- ER Data Objects ---*/
  class ERLRGParametersValueUploadDTO {
    public var erID: Integer as ERID = null
    public var levyApplicationYear: Integer as LevyApplicationYear = null
    public var lrgCode: Integer as LRGCode = null
    public var lrgDesc: String as LRGDesc = null
    public var expectedRehabMgmtRate_MedEmp: Float as ExpectedRehabMgmtRate_MedEmp = null
    public var expectedRiskMgmtRate_MedEmp: Float as ExpectedRiskMgmtRate_MedEmp = null
    public var expectedRehabMgmtRate_LgeEmp: Float as ExpectedRehabMgmtRate_LgeEmp = null
    public var expectedRiskMgmtRate_LgeEmp: Float as ExpectedRiskMgmtRate_LgeEmp = null
    public var industrySizeModifier_MedEmp: Float as IndustrySizeModifier_MedEmp = null
    public var industrySizeModifier_LgeEmp: Float as IndustrySizeModifier_LgeEmp = null
    public var lrgRehabMgmtRate: Float as LRGRehabMgmtRate = null
    public var experienceYear: Integer as ExperienceYear = null

    public override function toString(): String {
      return "ERLRGParametersValueUploadDTO{" +
          "erID =" + erID + '' +
          ", levyApplicationYear =" + levyApplicationYear + '' +
          ", lrgCode =" + lrgCode + '' +
          ", lrgDesc ='" + lrgDesc + '\'' +
          ", expectedRehabMgmtRate_MedEmp =" + expectedRehabMgmtRate_MedEmp + '' +
          ", expectedRiskMgmtRate_MedEmp =" + expectedRiskMgmtRate_MedEmp + '' +
          ", expectedRehabMgmtRate_LgeEmp =" + expectedRehabMgmtRate_LgeEmp + '' +
          ", expectedRiskMgmtRate_LgeEmp =" + expectedRiskMgmtRate_LgeEmp + '' +
          ", industrySizeModifier_MedEmp =" + industrySizeModifier_MedEmp + '' +
          ", industrySizeModifier_LgeEmp =" + industrySizeModifier_LgeEmp + '' +
          ", lrgRehabMgmtRate =" + lrgRehabMgmtRate + '' +
          ", experienceYear =" + experienceYear + '' +
          '}';
    }
  }

  /*--- ER Upload Parsers ---*/
  class ERLRGParametersValueUploadParser implements IRowParser<ERLRGParametersValueUploadDTO> {
    override function parseRow(csvParser : CSVParser) : Either<List<FieldValidationError>, ERLRGParametersValueUploadDTO> {
      try {
        var erID = csvParser.nextString().trim().toOptional()
        var levyApplicationYear = csvParser.nextString().trim().toOptional()
        var lrgCode = csvParser.nextString().trim().toOptional()
        var lrgDesc = csvParser.nextString().trim().toOptional()
        var expectedRehabMgmtRate_MedEmp = csvParser.nextString().trim().toOptional()
        var expectedRiskMgmtRate_MedEmp = csvParser.nextString().trim().toOptional()
        var expectedRehabMgmtRate_LgeEmp = csvParser.nextString().trim().toOptional()
        var expectedRiskMgmtRate_LgeEmp = csvParser.nextString().trim().toOptional()
        var industrySizeModifier_MedEmp = csvParser.nextString().trim().toOptional()
        var industrySizeModifier_LgeEmp = csvParser.nextString().trim().toOptional()
        var lrgRehabMgmtRate = csvParser.nextString().trim().toOptional()
        var experienceYear = csvParser.nextString().trim().toOptional()

        var parseErrors = verifyPresenceOfMandatoryFields(levyApplicationYear, lrgCode, lrgDesc,
            expectedRehabMgmtRate_MedEmp, expectedRiskMgmtRate_MedEmp, expectedRehabMgmtRate_LgeEmp, expectedRiskMgmtRate_LgeEmp,
            industrySizeModifier_MedEmp, industrySizeModifier_LgeEmp, lrgRehabMgmtRate, experienceYear)
        var dto = new ERLRGParametersValueUploadDTO()
        erID.each(\value -> {dto.ERID = Integer.valueOf(value)})
        levyApplicationYear.each(\value -> {dto.LevyApplicationYear = Integer.valueOf(value)})
        lrgCode.each(\value -> {dto.LRGCode = Integer.valueOf(value)})
        lrgDesc.each(\value -> {dto.LRGDesc = value})
        expectedRehabMgmtRate_MedEmp.each(\value -> {dto.ExpectedRehabMgmtRate_MedEmp = Float.valueOf(value)})
        expectedRiskMgmtRate_MedEmp.each(\value -> {dto.ExpectedRiskMgmtRate_MedEmp = Float.valueOf(value)})
        expectedRehabMgmtRate_LgeEmp.each(\value -> {dto.ExpectedRehabMgmtRate_LgeEmp = Float.valueOf(value)})
        expectedRiskMgmtRate_LgeEmp.each(\value -> {dto.ExpectedRiskMgmtRate_LgeEmp = Float.valueOf(value)})
        industrySizeModifier_MedEmp.each(\value -> {dto.IndustrySizeModifier_MedEmp = Float.valueOf(value)})
        industrySizeModifier_LgeEmp.each(\value -> {dto.IndustrySizeModifier_LgeEmp = Float.valueOf(value)})
        lrgRehabMgmtRate.each(\value -> {dto.LRGRehabMgmtRate = Float.valueOf(value)})
        experienceYear.each(\value -> {dto.ExperienceYear = Integer.valueOf(value)})

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
        lrgDesc : Optional<String>,
        expectedRehabMgmtRate_MedEmp : Optional<String>,
        expectedRiskMgmtRate_MedEmp : Optional<String>,
        expectedRehabMgmtRate_LgeEmp : Optional<String>,
        expectedRiskMgmtRate_LgeEmp : Optional<String>,
        industrySizeModifier_MedEmp : Optional<String>,
        industrySizeModifier_LgeEmp : Optional<String>,
        lrgRehabMgmtRate : Optional<String>,
        experienceYear : Optional<String>) : List<FieldValidationError> {
      var errors : LinkedList<FieldValidationError> = {}
      if (!levyApplicationYear.isPresent())
        errors.add(new FieldValidationError("LevyApplicationYear is required"))
      if (!lrgCode.isPresent())
        errors.add(new FieldValidationError("LRGCode is required"))
      if (!lrgDesc.isPresent())
        errors.add(new FieldValidationError("LRGDesc is required"))
      if (!expectedRehabMgmtRate_MedEmp.isPresent())
        errors.add(new FieldValidationError("ExpectedRehabMgmtRate_MedEmp is required"))
      if (!expectedRiskMgmtRate_MedEmp.isPresent())
        errors.add(new FieldValidationError("ExpectedRiskMgmtRate_MedEmp is required"))
      if (!expectedRehabMgmtRate_LgeEmp.isPresent())
        errors.add(new FieldValidationError("ExpectedRehabMgmtRate_LgeEmp is required"))
      if (!expectedRiskMgmtRate_LgeEmp.isPresent())
        errors.add(new FieldValidationError("ExpectedRiskMgmtRate_LgeEmp is required"))
      if (!industrySizeModifier_MedEmp.isPresent())
        errors.add(new FieldValidationError("IndustrySizeModifier_MedEmp is required"))
      if (!industrySizeModifier_LgeEmp.isPresent())
        errors.add(new FieldValidationError("IndustrySizeModifier_LgeEmp is required"))
      if (!lrgRehabMgmtRate.isPresent())
        errors.add(new FieldValidationError("LRGRehabMgmtRate is required"))
      if (!experienceYear.isPresent())
        errors.add(new FieldValidationError("ExperienceYear is required"))
      return errors
    }
  }

  /*--- ER Upload Processors ---*/
  class BulkERLRGParametersValueProcessor extends AbstractCSVProcessor<ERLRGParametersValueUploadDTO> {
    construct(rowParser : IRowParser<ERLRGParametersValueUploadDTO>, updater : BulkUploadProcessUpdater, uploadFile : File) {
      super(rowParser, updater, uploadFile)
      _log = StructuredLogger.CONFIG.withClass(BulkERLRGParametersValueProcessor)
    }

    override function processRows(rows : List<ERLRGParametersValueUploadDTO>) : CSVProcessorResult {
      var dataRows = rows
      var rowProcessErrors = new ArrayList<RowProcessError>()
      _log.info("Importing ${dataRows.Count} ERLRGParametersValues...")

      for (dataRow in dataRows index i) {
        var rowNumber = i + 1
        var lineNumber = i + 2
        createERLRGParametersValue(lineNumber, dataRow, rowProcessErrors)
      }
      return new CSVProcessorResult(dataRows.Count - rowProcessErrors.Count, rowProcessErrors)
    }

    private function createERLRGParametersValue(lineNumber : int, dto : ERLRGParametersValueUploadDTO, rowProcessErrors : List<RowProcessError>) {
      try {
        var oEntity : ERLRGParametersValue_ACC
        gw.transaction.Transaction.runWithNewBundle(\bundle -> {
          oEntity = new ERLRGParametersValue_ACC()
          oEntity.PublicID = "er:"+dto.ERID
          if(dto.LRGCode != null && dto.LevyApplicationYear != null) {
            var oERParamLRG = getERParamLRG(dto.LRGCode, dto.LevyApplicationYear)
            if(oERParamLRG != null)
              oEntity.ERParamLRG = oERParamLRG
          }
          oEntity.ExpectedRehabMgmtRate_MedEmp = dto.ExpectedRehabMgmtRate_MedEmp
          oEntity.ExpectedRiskMgmtRate_MedEmp = dto.ExpectedRiskMgmtRate_MedEmp
          oEntity.ExpectedRehabMgmtRate_LgeEmp = dto.ExpectedRehabMgmtRate_LgeEmp
          oEntity.ExpectedRiskMgmtRate_LgeEmp = dto.ExpectedRiskMgmtRate_LgeEmp
          oEntity.IndustrySizeModifier_MedEmp = dto.IndustrySizeModifier_MedEmp
          oEntity.IndustrySizeModifier_LgeEmp = dto.IndustrySizeModifier_LgeEmp
          oEntity.LRGRehabMgmtRate = dto.LRGRehabMgmtRate
          oEntity.ExperienceYear = dto.ExperienceYear
          _log.info("${lineNumber}: Created ER LRG Parameters Value")
        }, "sys")
        onSuccess()
      } catch (e : Exception) {
        _log.info("${lineNumber}: Creation of ER LRG Parameters Value failed for ${dto}: ${e.Message}")
        rowProcessErrors.add(new RowProcessError(lineNumber, e.Message))
        onFailure()
      }
    }

    private function getERParamLRG(lrgCode : Integer, levyApplicationYear : Integer) : ERParamLRG_ACC {
      return Query.make(ERParamLRG_ACC)
          .compare(ERParamLRG_ACC#LRGCode, Relop.Equals, lrgCode)
          .compare(ERParamLRG_ACC#LevyApplicationYear, Relop.Equals, levyApplicationYear)
          .select().AtMostOneRow
    }
  }
}