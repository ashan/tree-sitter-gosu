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

class ER_DM_Load_ERParamCredibleWeight {
  public function MigrateERData(csvPath : String) {
    var executor = Executors.newWorkStealingPool(40)
    var inputFile = new File(csvPath+"ERParamCredibleWeight.csv")
    var bulkUploader : ERParamCredibleWeightBulkUploader
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      bulkUploader = new ERParamCredibleWeightBulkUploader(inputFile, inputFile.Name, BulkUploadType_ACC.TC_ERDATAMIGRATION)
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

  class ERParamCredibleWeightBulkUploader extends AbstractBulkUploader {
    construct(uploadFile : File, uploadFileName : String, bulkUploadType : BulkUploadType_ACC) {
      super(uploadFile, uploadFileName, bulkUploadType)
    }
    override protected function getCSVProcessor(bulkUploadType : BulkUploadType_ACC, updater : BulkUploadProcessUpdater, uploadFile : File) : AbstractCSVProcessor {
      return new BulkERParamCredibleWeightProcessor(new ERParamCredibleWeightUploadParser(), updater, uploadFile)
    }
  }

  /*--- ER Data Objects ---*/
  class ERParamCredibleWeightUploadDTO {
    public var erID: Integer as ERID = null
    public var levyApplicationYear: Integer as LevyApplicationYear = null
    public var credibilityWeightingBand: Integer as CredibilityWeightingBand = null
    public var credibilityWtLowerLimit: Integer as CredibilityWtLowerLimit = null
    public var credibilityWtUpperLimit: Integer as CredibilityWtUpperLimit = null
    public var bandCredibilityWt: Float as BandCredibilityWt = null
    public var minLiableEarnings: MonetaryAmount as MinLiableEarnings = null
    public var maxLiableEarnings: MonetaryAmount as MaxLiableEarnings = null
    public var bandLiableEarnings: MonetaryAmount as BandLiableEarnings = null

    public override function toString(): String {
      return "ERParamCredibleWeightUploadDTO{" +
          "erID =" + ERID + '' +
          ", levyApplicationYear =" + levyApplicationYear + '' +
          ", credibilityWeightingBand =" + credibilityWeightingBand + '' +
          ", credibilityWtLowerLimit =" + credibilityWtLowerLimit + '' +
          ", credibilityWtUpperLimit =" + credibilityWtUpperLimit + '' +
          ", bandCredibilityWt =" + bandCredibilityWt + '' +
          ", minLiableEarnings =" + minLiableEarnings + '' +
          ", maxLiableEarnings =" + maxLiableEarnings + '' +
          ", bandLiableEarnings =" + bandLiableEarnings + '' +
          '}';
    }
  }

  /*--- ER Upload Parsers ---*/
  class ERParamCredibleWeightUploadParser implements IRowParser<ERParamCredibleWeightUploadDTO> {
    override function parseRow(csvParser : CSVParser) : Either<List<FieldValidationError>, ERParamCredibleWeightUploadDTO> {
      try {
        var erID = csvParser.nextString().trim().toOptional()
        var levyApplicationYear = csvParser.nextString().trim().toOptional()
        var credibilityWeightingBand = csvParser.nextString().trim().toOptional()
        var credibilityWtLowerLimit = csvParser.nextString().trim().toOptional()
        var credibilityWtUpperLimit = csvParser.nextString().trim().toOptional()
        var bandCredibilityWt = csvParser.nextString().trim().toOptional()
        var minLiableEarnings = csvParser.nextString().trim().toOptional()
        var maxLiableEarnings = csvParser.nextString().trim().toOptional()
        var bandLiableEarnings = csvParser.nextString().trim().toOptional()

        var parseErrors = verifyPresenceOfMandatoryFields(levyApplicationYear, credibilityWeightingBand, credibilityWtLowerLimit, credibilityWtUpperLimit, bandCredibilityWt, minLiableEarnings, maxLiableEarnings, bandLiableEarnings)
        var dto = new ERParamCredibleWeightUploadDTO()
        erID.each(\value -> {dto.ERID = Integer.valueOf(value)})
        levyApplicationYear.each(\value -> {dto.LevyApplicationYear = Integer.valueOf(value)})
        credibilityWeightingBand.each(\value -> {dto.CredibilityWeightingBand = Integer.valueOf(value)})
        credibilityWtLowerLimit.each(\value -> {dto.CredibilityWtLowerLimit = Integer.valueOf(value)})
        credibilityWtUpperLimit.each(\value -> {dto.CredibilityWtUpperLimit = Integer.valueOf(value)})
        bandCredibilityWt.each(\value -> {dto.BandCredibilityWt = Float.valueOf(value)})
        minLiableEarnings.each(\value -> {dto.MinLiableEarnings = new BigDecimal(value).toMonetaryAmount()})
        maxLiableEarnings.each(\value -> {dto.MaxLiableEarnings = new BigDecimal(value).toMonetaryAmount()})
        bandLiableEarnings.each(\value -> {dto.BandLiableEarnings = new BigDecimal(value).toMonetaryAmount()})

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
        credibilityWeightingBand : Optional<String>,
        credibilityWtLowerLimit : Optional<String>,
        credibilityWtUpperLimit : Optional<String>,
        bandCredibilityWt : Optional<String>,
        minLiableEarnings : Optional<String>,
        maxLiableEarnings : Optional<String>,
        bandLiableEarnings : Optional<String>) : List<FieldValidationError> {

      var errors : LinkedList<FieldValidationError> = {}

      if (!levyApplicationYear.isPresent())
        errors.add(new FieldValidationError("LevyApplicationYear is required"))
      if (!credibilityWeightingBand.isPresent())
        errors.add(new FieldValidationError("CredibilityWeightingBand is required"))
      if (!credibilityWtLowerLimit.isPresent())
        errors.add(new FieldValidationError("CredibilityWtLowerLimit is required"))
      if (!credibilityWtUpperLimit.isPresent())
        errors.add(new FieldValidationError("CredibilityWtUpperLimit is required"))
      if (!bandCredibilityWt.isPresent())
        errors.add(new FieldValidationError("BandCredibilityWt is required"))
      if (!minLiableEarnings.isPresent())
        errors.add(new FieldValidationError("MinLiableEarnings is required"))
      if (!maxLiableEarnings.isPresent())
        errors.add(new FieldValidationError("MaxLiableEarnings is required"))
      if (!bandLiableEarnings.isPresent())
        errors.add(new FieldValidationError("BandLiableEarnings is required"))
      return errors
    }
  }

  /*--- ER Upload Processors ---*/
  class BulkERParamCredibleWeightProcessor extends AbstractCSVProcessor<ERParamCredibleWeightUploadDTO> {
    construct(rowParser : IRowParser<ERParamCredibleWeightUploadDTO>, updater : BulkUploadProcessUpdater, uploadFile : File) {
      super(rowParser, updater, uploadFile)
      _log = StructuredLogger.CONFIG.withClass(BulkERParamCredibleWeightProcessor)
    }

    override function processRows(rows : List<ERParamCredibleWeightUploadDTO>) : CSVProcessorResult {
      var dataRows = rows
      var rowProcessErrors = new ArrayList<RowProcessError>()
      _log.info("Importing ${dataRows.Count} ERParamCredibleWeights...")

      for (dataRow in dataRows index i) {
        var rowNumber = i + 1
        var lineNumber = i + 2
        createERParamCredibleWeight(lineNumber, dataRow, rowProcessErrors)
      }
      return new CSVProcessorResult(dataRows.Count - rowProcessErrors.Count, rowProcessErrors)
    }

    private function createERParamCredibleWeight(lineNumber : int, dto : ERParamCredibleWeightUploadDTO, rowProcessErrors : List<RowProcessError>) {
      try {
        var oEntity : ERParamCredibleWeight_ACC
        gw.transaction.Transaction.runWithNewBundle(\bundle -> {
          oEntity = new ERParamCredibleWeight_ACC()
          oEntity.PublicID = "er:"+dto.ERID
          oEntity.LevyApplicationYear = dto.LevyApplicationYear
          oEntity.CredibilityWeightingBand = dto.CredibilityWeightingBand
          oEntity.CredibilityWtLowerLimit = dto.CredibilityWtLowerLimit
          oEntity.CredibilityWtUpperLimit = dto.CredibilityWtUpperLimit
          oEntity.BandCredibilityWt = dto.BandCredibilityWt
          oEntity.MinLiableEarnings = dto.MinLiableEarnings
          oEntity.MaxLiableEarnings = dto.MaxLiableEarnings
          oEntity.BandLiableEarnings = dto.BandLiableEarnings
          _log.info("${lineNumber}: Created ER Parameters Credibility Weighting")
        }, "sys")
        onSuccess()
      } catch (e : Exception) {
        _log.info("${lineNumber}: Creation of ER Parameters Credibility Weighting failed for ${dto}: ${e.Message}")
        rowProcessErrors.add(new RowProcessError(lineNumber, e.Message))
        onFailure()
      }
    }
  }
}