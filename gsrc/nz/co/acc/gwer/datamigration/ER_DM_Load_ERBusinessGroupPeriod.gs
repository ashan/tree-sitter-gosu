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
uses gw.api.database.QuerySelectColumns
uses gw.api.database.Relop
uses gw.api.path.Paths
uses gw.pl.util.csv.CSVParser
uses edge.util.either.Either

uses java.util.concurrent.Executors
uses java.io.File

class ER_DM_Load_ERBusinessGroupPeriod {

  public function MigrateERData(csvPath : String) {
    var executor = Executors.newWorkStealingPool(40)
    var inputFile = new File(csvPath+"ERBusinessGroupPeriod.csv")
    var bulkUploader : ERBusinessGroupPeriodBulkUploader
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      bulkUploader = new ERBusinessGroupPeriodBulkUploader(inputFile, inputFile.Name, BulkUploadType_ACC.TC_ERDATAMIGRATION)
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

  class ERBusinessGroupPeriodBulkUploader extends AbstractBulkUploader {
    construct(uploadFile : File, uploadFileName : String, bulkUploadType : BulkUploadType_ACC) {
      super(uploadFile, uploadFileName, bulkUploadType)
    }
    override protected function getCSVProcessor(bulkUploadType : BulkUploadType_ACC, updater : BulkUploadProcessUpdater, uploadFile : File) : AbstractCSVProcessor {
      return new BulkERBusinessGroupPeriodProcessor(new ERBusinessGroupPeriodUploadParser(), updater, uploadFile)
    }
  }

  /*--- ER Data Objects ---*/
  class ERBusinessGroupPeriodUploadDTO {
    public var erID: Integer as ERID = null
    public var businessGroupMemberID: Integer as BusinessGroupMemberID = null
    public var membershipStart: Date as MembershipStart = null
    public var membershipEnd: Date as MembershipEnd = null
    public var createTime: Date as CreateTime = null
    public var createUser: String as CreateUser = null
    public var updateTime: Date as UpdateTime = null
    public var updateUser: String as UpdateUser = null

    public override function toString(): String {
      return "ERBusinessGroupPeriodUploadDTO{" +
          "erID =" + ERID + '' +
          ", businessGroupMemberID =" + businessGroupMemberID + '' +
          ", membershipStart ='" + membershipStart + '\'' +
          ", membershipEnd ='" + membershipEnd + '\'' +
          ", createTime ='" + createTime + '\'' +
          ", createUser ='" + createUser + '\'' +
          ", updateTime ='" + updateTime + '\'' +
          ", updateUser ='" + updateUser + '\'' +
          '}';
    }
  }

  /*--- ER Upload Parsers ---*/
  class ERBusinessGroupPeriodUploadParser implements IRowParser<ERBusinessGroupPeriodUploadDTO> {
    private final var dateParser = new DateParser()

    override function parseRow(csvParser : CSVParser) : Either<List<FieldValidationError>, ERBusinessGroupPeriodUploadDTO> {
      try {
        var erID = csvParser.nextString().trim().toOptional()
        var businessGroupMemberID = csvParser.nextString().trim().toOptional()
        var membershipStart = csvParser.nextString().trim().toOptional()
        var membershipEnd = csvParser.nextString().trim().toOptional()
        var createTime = csvParser.nextString().trim().toOptional()
        var createUser = csvParser.nextString().trim().toOptional()
        var updateTime = csvParser.nextString().trim().toOptional()
        var updateUser = csvParser.nextString().trim().toOptional()

        var parseErrors = verifyPresenceOfMandatoryFields(businessGroupMemberID, membershipStart)
        var dto = new ERBusinessGroupPeriodUploadDTO()
        erID.each(\value -> {dto.ERID = Integer.valueOf(value)})
        businessGroupMemberID.each(\value -> {dto.BusinessGroupMemberID = Integer.valueOf(value)})
        parseField(parseErrors, dateParser, membershipStart,
            \parsedResult -> {dto.MembershipStart = parsedResult})
        parseField(parseErrors, dateParser, membershipEnd,
            \parsedResult -> {dto.MembershipEnd = parsedResult})
        parseField(parseErrors, dateParser, createTime,
            \parsedResult -> {dto.CreateTime = parsedResult})
        createUser.each(\value -> {dto.CreateUser = value})
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
        businessGroupMemberID : Optional<String>,
        membershipStart : Optional<String>) : List<FieldValidationError> {

      var errors : LinkedList<FieldValidationError> = {}

      if (!businessGroupMemberID.isPresent()) {
        errors.add(new FieldValidationError("BusinessGroupMemberID is required"))
      }
      if (!membershipStart.isPresent()) {
        errors.add(new FieldValidationError("MembershipStart is required"))
      }
      return errors
    }
  }

  /*--- ER Upload Processors ---*/
  class BulkERBusinessGroupPeriodProcessor extends AbstractCSVProcessor<ERBusinessGroupPeriodUploadDTO> {
    construct(rowParser : IRowParser<ERBusinessGroupPeriodUploadDTO>, updater : BulkUploadProcessUpdater, uploadFile : File) {
      super(rowParser, updater, uploadFile)
      _log = StructuredLogger.CONFIG.withClass(BulkERBusinessGroupPeriodProcessor)
    }

    override function processRows(rows : List<ERBusinessGroupPeriodUploadDTO>) : CSVProcessorResult {
      var dataRows = rows
      var rowProcessErrors = new ArrayList<RowProcessError>()
      _log.info("Importing ${dataRows.Count} ERBusinessGroupPeriods...")

      for (dataRow in dataRows index i) {
        var rowNumber = i + 1
        var lineNumber = i + 2
        updateERBusinessGroupMemberPeriod(lineNumber, dataRow, rowProcessErrors)
      }
      return new CSVProcessorResult(dataRows.Count - rowProcessErrors.Count, rowProcessErrors)
    }

    private function updateERBusinessGroupMemberPeriod(lineNumber : int, dto : ERBusinessGroupPeriodUploadDTO, rowProcessErrors : List<RowProcessError>) {
      try {
        var oERBusinessGroupMember = getERBusinessGroupMember("er:"+dto.BusinessGroupMemberID)
        if (oERBusinessGroupMember != null) {
          if ((oERBusinessGroupMember.MembershipStart == null)
              or (oERBusinessGroupMember.MembershipStart == dto.MembershipStart)) {
            gw.transaction.Transaction.runWithNewBundle(\bundle -> {
              var oEntity = bundle.add(oERBusinessGroupMember)
              oEntity.MembershipStart = dto.MembershipStart
              oEntity.MembershipEnd = dto.MembershipEnd
              _log.info("${lineNumber}: Update ER Business Group Member period dates")
            }, "sys")
            oERBusinessGroupMember.refresh()
          } else {
            // create new member based on
            var newPubliID = getNextPublicID(oERBusinessGroupMember.PublicID)
            var oNewEntity : ERBusinessGroupMember_ACC
            gw.transaction.Transaction.runWithNewBundle(\bundle -> {
              oNewEntity = new ERBusinessGroupMember_ACC()
              oNewEntity.PublicID = newPubliID
              oNewEntity.ERBusinessGroup = oERBusinessGroupMember.ERBusinessGroup
              oNewEntity.ACCPolicyID_ACC = oERBusinessGroupMember.ACCPolicyID_ACC
              oNewEntity.MembershipStart = dto.MembershipStart
              oNewEntity.MembershipEnd = dto.MembershipEnd
              _log.info("${lineNumber}: Create ER Business Group Member period dates")
            }, "sys")
          }
        }
        onSuccess()
      } catch (e : Exception) {
        _log.info("${lineNumber}: Creation of ER Business Group Member failed for ${dto}: ${e.Message}")
        rowProcessErrors.add(new RowProcessError(lineNumber, e.Message))
        onFailure()
      }
    }

    private function getERBusinessGroupMember(publicID : String) : ERBusinessGroupMember_ACC {
      var targetMember = Query.make(ERBusinessGroupMember_ACC)
          .compareIgnoreCase(ERBusinessGroupMember_ACC#PublicID, Relop.Equals, publicID)
          .select().FirstResult
      if (targetMember.MembershipStart == null)
        return targetMember
      return Query.make(ERBusinessGroupMember_ACC)
          .compareIgnoreCase(ERBusinessGroupMember_ACC#ACCPolicyID_ACC, Relop.Equals, targetMember.ACCPolicyID_ACC)
          .compare(ERBusinessGroupMember_ACC#ERBusinessGroup, Relop.Equals, targetMember.ERBusinessGroup)
          .select().orderByDescending(
              QuerySelectColumns.path(Paths.make(ERBusinessGroupMember_ACC#ID))
          ).FirstResult
    }

    private function getNextPublicID(publicID : String) : String {
      var newID : String
      var parts = publicID.split("_")
      if (parts.length == 1) {
        newID = publicID + "_1"
      } else {
        var idVersion = Integer.valueOf(parts[parts.length - 1]) + 1
        newID = parts[0] + "_" + String.valueOf(idVersion)
      }
      return newID
    }
  }
}