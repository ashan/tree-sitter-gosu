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
uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.pl.util.csv.CSVParser
uses edge.util.either.Either

uses java.util.concurrent.Executors
uses java.io.File

class ER_DM_Load_ERBusinessGroupMember {

  public function MigrateERData(csvPath : String) {
    var executor = Executors.newWorkStealingPool(40)
    var inputFile = new File(csvPath+"ERBusinessGroupMember.csv")
    var bulkUploader : ERBusinessGroupMemberBulkUploader
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      bulkUploader = new ERBusinessGroupMemberBulkUploader(inputFile, inputFile.Name, BulkUploadType_ACC.TC_ERDATAMIGRATION)
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

  class ERBusinessGroupMemberBulkUploader extends AbstractBulkUploader {
    construct(uploadFile : File, uploadFileName : String, bulkUploadType : BulkUploadType_ACC) {
      super(uploadFile, uploadFileName, bulkUploadType)
    }
    override protected function getCSVProcessor(bulkUploadType : BulkUploadType_ACC, updater : BulkUploadProcessUpdater, uploadFile : File) : AbstractCSVProcessor {
      return new BulkERBusinessGroupMemberProcessor(new ERBusinessGroupMemberUploadParser(), updater, uploadFile)
    }
  }

  /*--- ER Data Objects ---*/
  class ERBusinessGroupMemberUploadDTO {
    public var erID: Integer as ERID = null
    public var businessGroupMemberID: Integer as BusinessGroupMemberID = null
    public var businessGroupID: String as BusinessGroupID = null
    public var aCCPolicyID_ACC: String as ACCPolicyID_ACC = null
    public var createTime: Date as CreateTime = null
    public var createUser: String as CreateUser = null
    public var updateTime: Date as UpdateTime = null
    public var updateUser: String as UpdateUser = null

    public override function toString(): String {
      return "ERBusinessGroupMemberUploadDTO{" +
          "erID ='" + ERID + '\'' +
          ", businessGroupMemberID =" + businessGroupMemberID + '' +
          ", businessGroupID ='" + businessGroupID + '\'' +
          ", ACCPolicyID_ACC ='" + aCCPolicyID_ACC + '\'' +
          ", createTime ='" + createTime + '\'' +
          ", createUser ='" + createUser + '\'' +
          ", updateTime ='" + updateTime + '\'' +
          ", updateUser ='" + updateUser + '\'' +
          '}';
    }
  }

  /*--- ER Upload Parsers ---*/
  class ERBusinessGroupMemberUploadParser implements IRowParser<ERBusinessGroupMemberUploadDTO> {
    private final var dateParser = new DateParser()

    override function parseRow(csvParser : CSVParser) : Either<List<FieldValidationError>, ERBusinessGroupMemberUploadDTO> {
      try {
        var erID = csvParser.nextString().trim().toOptional()
        var businessGroupMemberID = csvParser.nextString().trim().toOptional()
        var businessGroupID = csvParser.nextString().trim().toOptional()
        var ACCPolicyID_ACC = csvParser.nextString().trim().toOptional()
        var createTime = csvParser.nextString().trim().toOptional()
        var createUser = csvParser.nextString().trim().toOptional()
        var updateTime = csvParser.nextString().trim().toOptional()
        var updateUser = csvParser.nextString().trim().toOptional()

        var parseErrors = verifyPresenceOfMandatoryFields(businessGroupID, ACCPolicyID_ACC)
        var dto = new ERBusinessGroupMemberUploadDTO()
        erID.each(\value -> {dto.ERID = Integer.valueOf(value)})
        businessGroupMemberID.each(\value -> {dto.BusinessGroupMemberID = Integer.valueOf(value)})
        businessGroupID.each(\value -> {dto.BusinessGroupID = value})
        ACCPolicyID_ACC.each(\value -> {dto.ACCPolicyID_ACC = value})
        parseField(parseErrors, dateParser, createTime,
            \parsedResult -> {
              dto.CreateTime = parsedResult
            })
        createUser.each(\value -> {
          dto.CreateUser = value})
        parseField(parseErrors, dateParser, updateTime,
            \parsedResult -> {
              dto.UpdateTime = parsedResult
            })
        updateUser.each(\value -> {
          dto.UpdateUser = value
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
        businessGroupID : Optional<String>,
        ACCPolicyID_ACC : Optional<String>) : List<FieldValidationError> {

      var errors : LinkedList<FieldValidationError> = {}

      if (!businessGroupID.isPresent()) {
        errors.add(new FieldValidationError("BusinessGroupID is required"))
      }
      if (!ACCPolicyID_ACC.isPresent()) {
        errors.add(new FieldValidationError("ACCPolicyID_ACC is required"))
      }
      return errors
    }
  }

  /*--- ER Upload Processors ---*/
  class BulkERBusinessGroupMemberProcessor extends AbstractCSVProcessor<ERBusinessGroupMemberUploadDTO> {
    construct(rowParser : IRowParser<ERBusinessGroupMemberUploadDTO>, updater : BulkUploadProcessUpdater, uploadFile : File) {
      super(rowParser, updater, uploadFile)
      _log = StructuredLogger.CONFIG.withClass(BulkERBusinessGroupMemberProcessor)
    }

    override function processRows(rows : List<ERBusinessGroupMemberUploadDTO>) : CSVProcessorResult {
      var ERBusinessGroupMembers = rows
      var rowProcessErrors = new ArrayList<RowProcessError>()
      _log.info("Importing ${ERBusinessGroupMembers.Count} ERBusinessGroupMembers...")

      for (ERBusinessGroupMember in ERBusinessGroupMembers index i) {
        var rowNumber = i + 1
        var lineNumber = i + 2
        createERBusinessGroupMember(lineNumber, ERBusinessGroupMember, rowProcessErrors)
      }
      return new CSVProcessorResult(ERBusinessGroupMembers.Count - rowProcessErrors.Count, rowProcessErrors)
    }

    private function createERBusinessGroupMember(lineNumber : int, dto : ERBusinessGroupMemberUploadDTO, rowProcessErrors : List<RowProcessError>) {
      try {
        var oEntity : ERBusinessGroupMember_ACC
        gw.transaction.Transaction.runWithNewBundle(\bundle -> {
          oEntity = new ERBusinessGroupMember_ACC()
          oEntity.PublicID = "er:"+dto.BusinessGroupMemberID
          if(dto.BusinessGroupID != null) {
            var oERBusinessGroup = getERBusinessGroup("er:"+dto.BusinessGroupID)
            if(oERBusinessGroup != null)
              oEntity.ERBusinessGroup = oERBusinessGroup
          }
          oEntity.ACCPolicyID_ACC = dto.ACCPolicyID_ACC
          _log.info("${lineNumber}: Created ER Business Group Member")
        }, "sys")
        onSuccess()
      } catch (e : Exception) {
        _log.info("${lineNumber}: Creation of ER Business Group Member failed for ${dto}: ${e.Message}")
        rowProcessErrors.add(new RowProcessError(lineNumber, e.Message))
        onFailure()
      }
    }

    private function getERBusinessGroup(publicID : String) : ERBusinessGroup_ACC {
      return Query.make(ERBusinessGroup_ACC)
          .compareIgnoreCase(ERBusinessGroup_ACC#PublicID, Relop.Equals, publicID)
          .select().AtMostOneRow
    }
  }
}