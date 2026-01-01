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

class ER_DM_Load_ERFileTypeDetail {

  public function MigrateERData(csvPath : String) {
    var executor = Executors.newWorkStealingPool(40)
    var inputFile = new File(csvPath+"ERFileTypeDetail.csv")
    var bulkUploader : ERFileTypeDetailBulkUploader
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      bulkUploader = new ERFileTypeDetailBulkUploader(inputFile, inputFile.Name, BulkUploadType_ACC.TC_ERDATAMIGRATION)
    })
    try {
      executor.submit(\-> bulkUploader.run())
    } catch (e : Exception) {
      print("Bulk uploader can not be scheduled for execution: "+e)
    }
    //shutdown ExecutorService
    executor.shutdown();
    while (!executor.isTerminated()) {   }
    System.out.println("Finished all ERFileTypeDetail threads");
  }

  class ERFileTypeDetailBulkUploader extends AbstractBulkUploader {
    construct(uploadFile : File, uploadFileName : String, bulkUploadType : BulkUploadType_ACC) {
      super(uploadFile, uploadFileName, bulkUploadType)
    }
    override protected function getCSVProcessor(bulkUploadType : BulkUploadType_ACC, updater : BulkUploadProcessUpdater, uploadFile : File) : AbstractCSVProcessor {
      return new BulkERFileTypeDetailProcessor(new ERFileTypeDetailUploadParser(), updater, uploadFile)
    }
  }

  /*--- ER Data Objects ---*/
  class ERFileTypeDetailUploadDTO {
    public var erID: Integer as ERID = null
    public var tabName: String as TabName = null
    public var fileType: String as FileType = null

    public override function toString(): String {
      return "ERFileTypeDetailUploadDTO{" +
          "erID =" + erID + '' +
          ", tabName ='" + tabName + '\'' +
          ", fileType ='" + fileType + '\'' +
          '}';
    }
  }

  /*--- ER Upload Parsers ---*/
  class ERFileTypeDetailUploadParser implements IRowParser<ERFileTypeDetailUploadDTO> {
    override function parseRow(csvParser : CSVParser) : Either<List<FieldValidationError>, ERFileTypeDetailUploadDTO> {
      try {
        var erID = csvParser.nextString().trim().toOptional()
        var tabName = csvParser.nextString().trim().toOptional()
        var fileType = csvParser.nextString().trim().toOptional()

        var parseErrors = verifyPresenceOfMandatoryFields(tabName, fileType)
        var dto = new ERFileTypeDetailUploadDTO()
        erID.each(\value -> {dto.ERID = Integer.valueOf(value)})
        tabName.each(\value -> {dto.TabName = value})
        fileType.each(\value -> {dto.FileType = value})

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
        tabName : Optional<String>,
        fileType : Optional<String>) : List<FieldValidationError> {
      var errors : LinkedList<FieldValidationError> = {}
      if (!tabName.isPresent())
        errors.add(new FieldValidationError("TabName is required"))
      if (!fileType.isPresent())
        errors.add(new FieldValidationError("FileType is required"))
      return errors
    }
  }

  /*--- ER Upload Processors ---*/
  class BulkERFileTypeDetailProcessor extends AbstractCSVProcessor<ERFileTypeDetailUploadDTO> {
    construct(rowParser : IRowParser<ERFileTypeDetailUploadDTO>, updater : BulkUploadProcessUpdater, uploadFile : File) {
      super(rowParser, updater, uploadFile)
      _log = StructuredLogger.CONFIG.withClass(BulkERFileTypeDetailProcessor)
    }

    override function processRows(rows : List<ERFileTypeDetailUploadDTO>) : CSVProcessorResult {
      var dataRows = rows
      var rowProcessErrors = new ArrayList<RowProcessError>()
      _log.info("Importing ${dataRows.Count} ERFileTypeDetails...")

      for (dataRow in dataRows index i) {
        var rowNumber = i + 1
        var lineNumber = i + 2
        createERFileTypeDetail(lineNumber, dataRow, rowProcessErrors)
      }
      return new CSVProcessorResult(dataRows.Count - rowProcessErrors.Count, rowProcessErrors)
    }

    private function createERFileTypeDetail(lineNumber : int, dto : ERFileTypeDetailUploadDTO, rowProcessErrors : List<RowProcessError>) {
      try {
        var oEntity : ERFileTypeDetail_ACC
        gw.transaction.Transaction.runWithNewBundle(\bundle -> {
          oEntity = new ERFileTypeDetail_ACC()
          oEntity.PublicID = "er:"+dto.ERID
          oEntity.TabName = dto.TabName
          if(dto.FileType != null) {
            var oERFileType = getERFileType(dto.FileType)
            if(oERFileType != null)
              oEntity.ERFileType = oERFileType
          }
          _log.info("${lineNumber}: Created ER File Type Detail")
        }, "sys")
        onSuccess()
      } catch (e : Exception) {
        _log.info("${lineNumber}: Creation of ER File Type Detail failed for ${dto}: ${e.Message}")
        rowProcessErrors.add(new RowProcessError(lineNumber, e.Message))
        onFailure()
      }
    }

    private function getERFileType(fileType : String) : ERFileType_ACC {
      return Query.make(ERFileType_ACC)
          .compareIgnoreCase(ERFileType_ACC#FileType, Relop.Equals, fileType)
          .select().AtMostOneRow
    }
  }
}