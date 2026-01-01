package nz.co.acc.plm.integration.bulkupload.csvprocessor

uses entity.Activity
uses gw.api.database.Query
uses gw.api.database.QuerySelectColumns
uses gw.api.database.Relop
uses gw.api.path.Paths
uses nz.co.acc.activity.ActivityCodes
uses nz.co.acc.common.integration.bulkupload.BulkUploadProcessUpdater
uses nz.co.acc.common.integration.bulkupload.csvprocessor.AbstractCSVProcessor
uses nz.co.acc.common.integration.bulkupload.csvprocessor.CSVProcessorResult
uses nz.co.acc.common.integration.bulkupload.csvrowparser.IRowParser
uses nz.co.acc.common.integration.bulkupload.error.RowProcessError

uses nz.co.acc.plm.integration.bulkupload.csvrowparser.CreateActivityParser
uses nz.co.acc.plm.integration.bulkupload.csvtypes.ActivityUploadDTO
uses nz.co.acc.plm.integration.instruction.util.InstructionConstantHelper
uses nz.co.acc.plm.integration.ir.util.ConstantPropertyHelper
uses nz.co.acc.plm.util.AssignableQueueUtils
uses gw.surepath.suite.integration.logging.StructuredLogger

uses java.io.File

/**
 * Processes a CSV file to remove holds on migrated policies
 */
class BulkCreateActivitiesProcessor extends AbstractCSVProcessor<ActivityUploadDTO> {
  private final var _activityPatternMap : Map<String, ActivityPattern> = buildActivityPatternMap()
  private final var _assignableQueues : List<AssignableQueue> = AssignableQueueUtils.getAssignableQueues()

  private var _productCodeMap : HashMap<String, String> = {
      InstructionConstantHelper.PRODUCTKEY_WPC->ConstantPropertyHelper.PRODUCTCODE_WPC,
      InstructionConstantHelper.PRODUCTKEY_WPS->ConstantPropertyHelper.PRODUCTCODE_WPS,
      InstructionConstantHelper.PRODUCTKEY_CP->ConstantPropertyHelper.PRODUCTCODE_CP
  }

  private var _defaultActivityCode = ActivityCodes.GeneralReminder

  construct(rowParser : IRowParser<ActivityUploadDTO>, updater : BulkUploadProcessUpdater, uploadFile : File) {
    super(rowParser, updater, uploadFile)
    _log = StructuredLogger.CONFIG.withClass(BulkCreateActivitiesProcessor)
  }

  public static function newInstance(updater : BulkUploadProcessUpdater, uploadFile : File) : BulkCreateActivitiesProcessor {
    var parser = new CreateActivityParser()
    return new BulkCreateActivitiesProcessor(parser, updater, uploadFile)
  }

  override function processRows(rows : List<ActivityUploadDTO>) : CSVProcessorResult {
    var activities = rows
    var rowProcessErrors = new ArrayList<RowProcessError>()

    _log.info("Importing ${activities.Count} activities...")

    for (activity in activities index i) {
      var rowNumber = i + 1
      var lineNumber = i + 2

      if (activity.IsAccountActivity) {
        createAccountActivity(lineNumber, activity, rowProcessErrors)
      } else {
        createPolicyActivity(lineNumber, activity, rowProcessErrors)
      }
    }

    return new CSVProcessorResult(activities.Count - rowProcessErrors.Count, rowProcessErrors)
  }

  private function createAccountActivity(lineNumber : int, activity : ActivityUploadDTO, rowProcessErrors : List<RowProcessError>) {
    var account = searchAndGetAccount(activity)

    if (account == null) {
      _log.info("${lineNumber}: Account ${activity.ACCNumber} not found.")
      rowProcessErrors.add(new RowProcessError(lineNumber, "Account not found"))
      onFailure()
      return
    }

    var activityPatternCode = _defaultActivityCode
    var activityPattern = findActivityPattern(activityPatternCode)
    if (!activityPattern.Present) {
      rowProcessErrors.add(new RowProcessError(lineNumber, "ActivityPattern code '${activityPatternCode}' not found"))
      onFailure()
      return
    }

    try {
      gw.transaction.Transaction.runWithNewBundle(\bundle -> {
        account = bundle.add(account)

        var oActivity = activityPattern.get().createAccountActivity(bundle,
            activityPattern.get(),
            account,
            activity.Subject,
            activity.Description,
            null,
            activity.Priority,
            null,
            activity.DueDate,
            activity.EscalationDate)

        _log.info("${lineNumber}: Created activity for account ${activity.ACCNumber}")

        if (activity.Recurring != null) {
          oActivity.Recurring = activity.Recurring
        }

        assignQueueOrUser(oActivity, activity.AssignedQueue)
      }, "sys")

      onSuccess()

    } catch (e : Exception) {
      _log.info("${lineNumber}: Creation of activities failed for ${activity}: ${e.Message}")
      rowProcessErrors.add(new RowProcessError(lineNumber, e.Message))
      onFailure()
    }
  }

  private function createPolicyActivity(lineNumber : int, activity : ActivityUploadDTO, rowProcessErrors : List<RowProcessError>) {
    final var fn = "createPolicyActivity"
    var account = searchAndGetAccount(activity)

    if (account == null) {
      _log.info("${lineNumber}: Account ${activity.ACCNumber} not found.")
      rowProcessErrors.add(new RowProcessError(lineNumber, "Account not found"))
      onFailure()
      return

    } else if (account.AEPContractAccount_ACC) {
      _log.info("${lineNumber}: Policy ${activity.ACCNumber + activity.Suffix} not found.")
      rowProcessErrors.add(new RowProcessError(lineNumber, "AEP Policies are not supported"))
      onFailure()
      return
    }

    var policyTerm = Query.make(PolicyTerm)
        .compare(PolicyTerm#AEPACCNumber_ACC, Relop.Equals, activity.ACCNumber)
        .compare(PolicyTerm#AEPProductCode_ACC, Relop.Equals, _productCodeMap.get(activity.Suffix))
        .select()
        .orderByDescending(QuerySelectColumns.path(Paths.make(PolicyTerm#AEPFinancialYear_ACC)))
        .first()

    if (policyTerm == null) {
      _log.info("${lineNumber}: Policy ${activity.ACCNumber + activity.Suffix} not found.")
      rowProcessErrors.add(new RowProcessError(lineNumber, "PolicyTerm not found"))
      onFailure()
      return
    }

    var policy = policyTerm.Policy

//    var activityPatternCode = activity.ActivityPattern != null ? activity.ActivityPattern : _defaultActivityCode
    var activityPatternCode = _defaultActivityCode
    var activityPattern = findActivityPattern(activityPatternCode)
    if (!activityPattern.Present) {
      rowProcessErrors.add(new RowProcessError(lineNumber, "ActivityPattern code '${activityPatternCode}' not found"))
      onFailure()
      return
    }

    try {
      gw.transaction.Transaction.runWithNewBundle(\bundle -> {
        policy = bundle.add(policy)
        var oActivity = activityPattern.get().createPolicyActivity(bundle, policy,
            activity.Subject,
            activity.Description,
            null,
            activity.Priority,
            null,
            activity.DueDate,
            activity.EscalationDate)

        if (activity.Recurring != null) {
          oActivity.Recurring = activity.Recurring
        }

        assignQueueOrUser(oActivity, activity.AssignedQueue)

        _log.info("${lineNumber}: Created activity for Policy ${activity.ACCNumber + activity.Suffix}")
      }, "sys")

      onSuccess()

    } catch (e : Exception) {
      _log.info("${lineNumber}: Creation of activities failed for ${activity}: ${e.Message}")
      rowProcessErrors.add(new RowProcessError(lineNumber, e.Message))
      onFailure()
    }
  }

  private function assignQueueOrUser(activity : Activity, queueOrUser : String) {
    var assignableQueue = _assignableQueues.firstWhere(\x -> x.Name.equalsIgnoreCase(queueOrUser))

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

  private function buildActivityPatternMap() : Map<String, ActivityPattern> {
    return Query.make(ActivityPattern).select().mapToKeyAndValue(\ap -> ap.Code, \ap -> ap)
  }

  private function findActivityPattern(code : String) : Optional<ActivityPattern> {
    return Optional.ofNullable(_activityPatternMap.get(code))
  }

  private function searchAndGetAccount(nActivity : ActivityUploadDTO) : Account {
    return Query.make(Account)
        .compare(Account#ACCID_ACC, Relop.Equals, nActivity.ACCNumber)
        .select().first()
  }

}