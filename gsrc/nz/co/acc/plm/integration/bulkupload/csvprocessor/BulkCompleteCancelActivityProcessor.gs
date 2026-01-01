package nz.co.acc.plm.integration.bulkupload.csvprocessor

uses entity.Activity
uses gw.api.database.DBFunction
uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.api.web.activity.ActivityUtil
uses nz.co.acc.common.integration.bulkupload.BulkUploadProcessUpdater
uses nz.co.acc.common.integration.bulkupload.csvprocessor.AbstractCSVProcessor
uses nz.co.acc.common.integration.bulkupload.csvprocessor.CSVProcessorResult
uses nz.co.acc.common.integration.bulkupload.csvrowparser.IRowParser
uses nz.co.acc.common.integration.bulkupload.error.RowProcessError

uses nz.co.acc.plm.integration.bulkupload.csvrowparser.CompleteCancelActivityParser
uses nz.co.acc.plm.integration.bulkupload.csvtypes.activity.CompleteCancelActivity
uses nz.co.acc.plm.util.AssignableQueueUtils
uses gw.surepath.suite.integration.logging.StructuredLogger

uses java.io.File

/**
 * Completes/cancels a bulk list of activities
 *
 * @param <RowType>
 */
class BulkCompleteCancelActivityProcessor extends AbstractCSVProcessor<CompleteCancelActivity> {

  private final var assignableQueues : List<AssignableQueue> = AssignableQueueUtils.getAssignableQueues()

  construct(rowParser : IRowParser<CompleteCancelActivity>, updater : BulkUploadProcessUpdater, uploadFile : File) {
    super(rowParser, updater, uploadFile)
    _log = StructuredLogger.CONFIG.withClass(BulkCompleteCancelActivityProcessor)
  }

  public static function newInstance(
      updater : BulkUploadProcessUpdater,
      uploadFile : File) : BulkCompleteCancelActivityProcessor {

    var parser = new CompleteCancelActivityParser()
    return new BulkCompleteCancelActivityProcessor(parser, updater, uploadFile)
  }

  override function processRows(activities : List<CompleteCancelActivity>) : CSVProcessorResult {
    var rowProcessErrors = new ArrayList<RowProcessError>()

    _log.info("Importing ${activities.Count} Complete Cancel Activities...")

    for (activity in activities index i) {
      var rowNumber = i + 1
      var lineNumber = i + 2

      try {
        var activityQuery = Query.make(Activity)

        activityQuery.compare(Activity#Status, Relop.Equals, ActivityStatus.TC_OPEN)
        activityQuery.compareIgnoreCase(Activity#Subject, Relop.Equals, activity.ActivitySubject)

        if (activity.ActivityDescription != null) {
          activityQuery.compareIgnoreCase(Activity#Description, Relop.Equals, activity.ActivityDescription)
        }

        if (activity.ActivityCreationDate != null) {
          activityQuery.compare(DBFunction.DateFromTimestamp(activityQuery.getColumnRef("CreateTime")), Relop.Equals, activity.ActivityCreationDate)
        }

        if (activity.ActivityDueDate != null) {
          activityQuery.compare(DBFunction.DateFromTimestamp(activityQuery.getColumnRef("TargetDate")), Relop.Equals, activity.ActivityDueDate)
        }

        if (activity.ActivityEscalationDate != null) {
          activityQuery.compare(DBFunction.DateFromTimestamp(activityQuery.getColumnRef("EscalationDate")), Relop.Equals, activity.ActivityEscalationDate)
        }

        activityQuery.compare(Activity#Priority, Relop.Equals, activity.ActivityPriority)

        if (activity.ActivityRecurring != null) {
          activityQuery.compare(Activity#Recurring, Relop.Equals, activity.ActivityRecurring)
        }

        if (activity.ActivityQueueOrUser != null) {
          if (assignableQueues.hasMatch(\elt1 -> elt1.Name == activity.ActivityQueueOrUser)) {
            var assignedQueueQuery = activityQuery.join("AssignedQueue")
            assignedQueueQuery.compare(AssignableQueue#Name, Relop.Equals, activity.ActivityQueueOrUser)
          } else {
            var assignedUserQuery = activityQuery.join("AssignedUser").join("Credential")
            assignedUserQuery.compare(Credential#UserName, Relop.Equals, activity.ActivityQueueOrUser)
          }
        }

        activityQuery.join("Account").compare(Account#ACCID_ACC, Relop.Equals, activity.AccountACCNumber)

        var activitiesToUpdate = activityQuery.select()
        var assignedActivities = new ArrayList<Activity>()
        if (activitiesToUpdate.Count > 0) {
          gw.transaction.Transaction.runWithNewBundle(\bundle -> {
            for (activityToUpdate in activitiesToUpdate) {
              var nActivityToUpdate = bundle.add(activityToUpdate)
              assignQueueOrUser(nActivityToUpdate, activity.AssignedUser)
              assignedActivities.add(nActivityToUpdate)
            }
          }, "sys")
          gw.transaction.Transaction.runWithNewBundle(\bundle -> {
            for (activityToUpdate in assignedActivities) {
              var nActivityToUpdate = bundle.add(activityToUpdate)
              _log.info("Completing activity ${nActivityToUpdate.PublicID}")
              ActivityUtil.completeActivities({nActivityToUpdate})
            }
          }, "sys")
          onSuccess()
        } else {
          _log.info("Failed to remove activies on Account : " + activity.AccountACCNumber)
          rowProcessErrors.add(new RowProcessError(lineNumber, "Failed to remove activies on Account : " + activity.AccountACCNumber))
          onFailure()
        }
      } catch (e : Exception) {
        _log.error_ACC("Removing activities failed for ${activity.AccountACCNumber}: ${e.Message}", e)
        rowProcessErrors.add(new RowProcessError(lineNumber, e.Message))
        onFailure()
      }
    }

    return new CSVProcessorResult(activities.Count - rowProcessErrors.Count, rowProcessErrors)
  }

  private function assignQueueOrUser(activity : Activity, queueOrUser : String) {
    var assignableQueue = assignableQueues.firstWhere(\x -> x.Name.equalsIgnoreCase(queueOrUser))
    if (assignableQueue != null) {
      activity.assignActivityToQueue(assignableQueue, assignableQueue.Group)
    } else {
      var user = getUser(queueOrUser)
      if (user == null) {
        throw new RuntimeException("Can not find an assignable queue or user named '${queueOrUser}'.")
      }
      var assigned = activity.assignUserAndDefaultGroup(user)
      if (!assigned) {
        throw new RuntimeException("User '${user}' does not have sufficient permission to accept the assignment.")
      }
    }
  }

  private function getUser(userName : String) : User {
    return Query.make(User)
        .join("Credential").compareIgnoreCase(Credential#UserName, Relop.Equals, userName)
        .select().AtMostOneRow
  }

}