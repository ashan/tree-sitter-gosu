package nz.co.acc.gwer.bulkupload.processor

uses gw.api.database.Query
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.integration.bulkupload.BulkUploadProcessUpdater
uses nz.co.acc.common.integration.bulkupload.csvprocessor.AbstractCSVProcessor
uses nz.co.acc.common.integration.bulkupload.csvprocessor.CSVProcessorResult
uses nz.co.acc.common.integration.bulkupload.csvrowparser.IRowParser
uses nz.co.acc.common.integration.bulkupload.error.RowProcessError
uses nz.co.acc.edge.capabilities.policy.util.PolicyUtil_ACC
uses nz.co.acc.gwer.ERUtils_ACC
uses nz.co.acc.gwer.bulkupload.ERCSVProcessorResult
uses nz.co.acc.gwer.bulkupload.ERCSVProcessorResult
uses nz.co.acc.gwer.bulkupload.parser.BusinessGroupParser
uses nz.co.acc.gwer.bulkupload.row.BusinessGroupRow
uses nz.co.acc.gwer.util.ERProcessUtils_ACC
uses nz.co.acc.gwer.util.ERUIUtils_ACC
uses nz.co.acc.lob.common.DateUtil_ACC

uses java.io.File

/**
 * Processes a CSV file to update account statuses.
 * Created by HamblyAl on 18/03/2019.
 */
class BulkBusinessGroupProcessor extends AbstractCSVProcessor<BusinessGroupRow> {

  var _createdBusinessGroups : ArrayList<ERBusinessGroup_ACC>
  construct(rowParser : IRowParser<BusinessGroupRow>, updater : BulkUploadProcessUpdater, uploadFile : File) {
    super(rowParser, updater, uploadFile)
    _createdBusinessGroups = new ArrayList<ERBusinessGroup_ACC>()
    _log = StructuredLogger.CONFIG.withClass(BulkBusinessGroupProcessor)
  }

  public static function newInstance(
      updater : BulkUploadProcessUpdater,
      uploadFile : File) : BulkBusinessGroupProcessor {
    var parser = new BusinessGroupParser()
    return new BulkBusinessGroupProcessor(parser, updater, uploadFile)
  }

  override function processRows(parsedRows : List<BusinessGroupRow>) : CSVProcessorResult {
    _log.info("Importing ${parsedRows.Count} business group members.")

    var rowsSuccessful = 0
    var lineNumber = 0
    var recordNumber = 0
    var rowProcessErrors = new ArrayList<RowProcessError>()

    try {
      var groupIDList = parsedRows.map(\elt -> elt.GroupID).toSet()

      gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\b -> groupIDList.each(\groupID -> {
        var groupMembers = parsedRows.where(\elt -> elt.ActiveInERPeriod and elt.GroupID == groupID)
        if (groupMembers.HasElements) {
          var businessGroup : ERBusinessGroup_ACC = null

          for (businessGroupRow in groupMembers index i) {
            recordNumber = i + 1
            lineNumber = i + 2

            try {

              var accPolicyIDExists = new ERProcessUtils_ACC().checkIfACCPolicyIDExists(businessGroupRow.ACCPolicyID)
              if(accPolicyIDExists) {
                if (!checkMemberIsInAGroup(businessGroupRow.ACCPolicyID)) {
                  var businessGroupMember = new ERBusinessGroupMember_ACC()
                  businessGroupMember.CompanyID = businessGroupRow.CompanyID
                  businessGroupMember.ACCPolicyID_ACC = businessGroupRow.ACCPolicyID

                  var accid = businessGroupRow.ACCPolicyID.substring(0, businessGroupRow.ACCPolicyID.length - 1)
                  var erUIUtils = new ERUIUtils_ACC()
                  businessGroupMember.AccountID = erUIUtils.getAccountByACCID(accid)
                  if (businessGroupRow.StartDate == null) {
                    businessGroupMember.MembershipStart = DateUtil_ACC.nextACCLevyYearStart(Date.CurrentDate)
                  } else {
                    businessGroupMember.MembershipStart = businessGroupRow.StartDate
                  }

                  businessGroupMember.MembershipEnd = businessGroupRow.EndDate

                  if(businessGroup == null) {
                    businessGroup = new ERBusinessGroup_ACC()
                    _log.info("Creating new business group for ${businessGroup.ID.Value}.")
                    _createdBusinessGroups.add(businessGroup)
                  }
                  businessGroupMember.ERBusinessGroup = businessGroup
                  businessGroup.addToMembers(businessGroupMember)
                  _log.info("Adding business group member for business group ${businessGroupRow.GroupID} with ACCPolicyID ${businessGroupRow.ACCPolicyID}.")

                  rowsSuccessful += 1
                  onSuccess()
                } else {
                  rowProcessErrors.add(new RowProcessError(lineNumber, "ACCPolicyID ${businessGroupRow.ACCPolicyID} is already a member of a business group"))
                  onFailure()
                }
              } else {
                rowProcessErrors.add(new RowProcessError(lineNumber, "ACCPolicyID ${businessGroupRow.ACCPolicyID} doesn't exist"))
                onFailure()
              }
            } catch (e: Exception) {
              rowProcessErrors.add(new RowProcessError(lineNumber, e.Message))
              onFailure()
            }
          }
        }
      }))


    } catch (e : Exception) {
      _log.error_ACC("Import failed: ${e.Message}")
      rowProcessErrors.add(new RowProcessError(lineNumber, "Error occurred. Failed to process file. No business groups were created.\r\n${e.Message}\r\n${e.StackTraceAsString}"))
      return new CSVProcessorResult(0, rowProcessErrors)
    }

    var comment = createComment()
    _log.info("Finished importing ${rowsSuccessful} business group members.")
    return new ERCSVProcessorResult(rowsSuccessful, rowProcessErrors, comment)
  }

  private function createComment() : String {
    var comment = new StringBuilder()
    _createdBusinessGroups.each(\elt -> {
      elt.refresh()
      comment.append("Business Group ${elt.ID.Value} is added with ${elt.Members.Count} members.\n")
    })

    return comment.toString()
  }

  private function checkMemberIsInAGroup(accPolicyID : String) : boolean {
    var query = Query.make(ERBusinessGroupMember_ACC)
    query.compare(ERBusinessGroupMember_ACC#ACCPolicyID_ACC, Equals, accPolicyID)
    return query.select().HasElements
  }
}