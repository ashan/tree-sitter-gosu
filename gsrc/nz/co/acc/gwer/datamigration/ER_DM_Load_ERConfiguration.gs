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

class ER_DM_Load_ERConfiguration {

  public function MigrateERData(csvPath : String) {
    var executor = Executors.newWorkStealingPool(40)
    var inputFile = new File(csvPath+"ERConfiguration.csv")
    var bulkUploader : ERConfigurationBulkUploader
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      bulkUploader = new ERConfigurationBulkUploader(inputFile, inputFile.Name, BulkUploadType_ACC.TC_ERDATAMIGRATION)
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

  class ERConfigurationBulkUploader extends AbstractBulkUploader {
    construct(uploadFile : File, uploadFileName : String, bulkUploadType : BulkUploadType_ACC) {
      super(uploadFile, uploadFileName, bulkUploadType)
    }
    override protected function getCSVProcessor(bulkUploadType : BulkUploadType_ACC, updater : BulkUploadProcessUpdater, uploadFile : File) : AbstractCSVProcessor {
      return new BulkERConfigurationProcessor(new ERConfigurationUploadParser(), updater, uploadFile)
    }
  }

  /*--- ER Data Objects ---*/
  class ERConfigurationUploadDTO {
    public var erID: Integer as ERID = null
    public var configName: String as ConfigName = null
    public var configValue: String as ConfigValue = null

    public override function toString(): String {
      return "ERConfigurationUploadDTO{" +
          "erID =" + erID + '' +
          ", name ='" + configName + '\'' +
          ", value ='" + configName + '\'' +
          '}';
    }
  }

  /*--- ER Upload Parsers ---*/
  class ERConfigurationUploadParser implements IRowParser<ERConfigurationUploadDTO> {
    override function parseRow(csvParser : CSVParser) : Either<List<FieldValidationError>, ERConfigurationUploadDTO> {
      try {
        var erID = csvParser.nextString().trim().toOptional()
        var configName = csvParser.nextString().trim().toOptional()
        var configValue = csvParser.nextString().trim().toOptional()

        var parseErrors = verifyPresenceOfMandatoryFields(configName, configValue)
        var dto = new ERConfigurationUploadDTO()
        erID.each(\value -> {dto.ERID = Integer.valueOf(value)})
        configName.each(\value -> {dto.ConfigName = value})
        configValue.each(\value -> {dto.ConfigValue = value})

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
        configName : Optional<String>,
        configValue : Optional<String>) : List<FieldValidationError> {
      var errors : LinkedList<FieldValidationError> = {}
      if (!configName.isPresent())
        errors.add(new FieldValidationError("Name is required"))
      if (!configValue.isPresent())
        errors.add(new FieldValidationError("Value is required"))
      return errors
    }
  }

  /*--- ER Upload Processors ---*/
  class BulkERConfigurationProcessor extends AbstractCSVProcessor<ERConfigurationUploadDTO> {
    construct(rowParser : IRowParser<ERConfigurationUploadDTO>, updater : BulkUploadProcessUpdater, uploadFile : File) {
      super(rowParser, updater, uploadFile)
      _log = StructuredLogger.CONFIG.withClass(BulkERConfigurationProcessor)
    }

    override function processRows(rows : List<ERConfigurationUploadDTO>) : CSVProcessorResult {
      var dataRows = rows
      var rowProcessErrors = new ArrayList<RowProcessError>()
      _log.info("Importing ${dataRows.Count} ERConfigurations...")

      for (dataRow in dataRows index i) {
        var rowNumber = i + 1
        var lineNumber = i + 2
        createERConfiguration(lineNumber, dataRow, rowProcessErrors)
      }
      return new CSVProcessorResult(dataRows.Count - rowProcessErrors.Count, rowProcessErrors)
    }

    private function createERConfiguration(lineNumber : int, dto : ERConfigurationUploadDTO, rowProcessErrors : List<RowProcessError>) {
      try {
        var oEntity : ERConfiguration_ACC
        gw.transaction.Transaction.runWithNewBundle(\bundle -> {
          oEntity = new ERConfiguration_ACC()
          oEntity.PublicID = "er:"+dto.ERID
          oEntity.Name = dto.ConfigName
          oEntity.Value = dto.ConfigValue
          _log.info("${lineNumber}: Created ER Configuration")
        }, "sys")
        onSuccess()
      } catch (e : Exception) {
        _log.info("${lineNumber}: Creation of ER Configuration failed for ${dto}: ${e.Message}")
        rowProcessErrors.add(new RowProcessError(lineNumber, e.Message))
        onFailure()
      }
    }
  }
}
