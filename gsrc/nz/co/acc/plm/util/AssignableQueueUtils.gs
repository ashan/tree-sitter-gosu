package nz.co.acc.plm.util

uses gw.api.database.Query
uses gw.api.database.Relop

uses gw.surepath.suite.integration.logging.StructuredLogger

uses java.lang.invoke.MethodHandles

/**
 * Created by ian on 16/10/2017.
 * <p>
 * Utility class for Assignable Queues
 */
class AssignableQueueUtils {
  private static final var _logger = StructuredLogger.CONFIG.withClass(MethodHandles.lookup().lookupClass())
  // Not setting the actual qNames as constants as updating would require an app restart,
  // We re-evaluate at runtime
  private static final var ASSIGNABLE_QUEUE_NAME_AEP = "DefaultAEPAssignableQueueName_ACC"
  private static final var ASSIGNABLE_QUEUE_NAME_CPX = "DefaultCPXAssignableQueueName_ACC"
  private static final var ASSIGNABLE_QUEUE_NAME_CPX_DELINQUENCY = "DefaultCPXDelinqencyAssignableQueueName_ACC"
  private static final var ASSIGNABLE_QUEUE_NAMES = "ActivityAssignableQueueNames_ACC"
  private static final var ASSIGNABLE_QUEUE_PORTAL_ACTIVITY = "PortalActivityAssignableQueueName_ACC"
  private static final var ASSIGNABLE_QUEUE_PORTAL_DFA_ISSUE = "PortalActivityDFAIssueAssignableQueueName_ACC"
  private static final var ASSIGNABLE_QUEUE_MIGRATED_POLICY_HOLD_ISSUE = "MigratedPolicyHoldActivityAssignableQueueName_ACC"

  private static final var ASSIGNABLE_QUEUE_SERVICE_PERFORMANCE_AND_PLANNING = "DefaultSPAndPAssignableQueueName_ACC"

  private static final var ASSIGNABLE_QUEUE_IR = "IRActivityAssignableQueueName_ACC"
  private static final var ASSIGNABLE_QUEUE_RENEWAL_ESCALATION = "DefaultRenewalEscalationAssignableQueueName_ACC"
  // ChrisA 30/07/2019 NTK-637 Assign Activity to queue start
  private static final var ASSIGNABLE_QUEUE_ERRORED_MESSAGES = "ContactMessageTransportErrorActivityQueueName_ACC"
  private static final var ASSIGNABLE_QUEUE_POLICY_ADMIN = "DefaultPolicyAdminAssignableQueueName_ACC"
  private static final var ASSIGNABLE_QUEUE_LEVY_MANAGEMENT = "DefaultLevyManagementAssignableQueueName_ACC"

  public static function getQueueForAep(): AssignableQueue {
    return getAssignableQueueByName(ScriptParameters.getParameterValue(ASSIGNABLE_QUEUE_NAME_AEP) as String)
  }

  public static function getQueueForCPX(): AssignableQueue {
    return getAssignableQueueByName(ScriptParameters.getParameterValue(ASSIGNABLE_QUEUE_NAME_CPX) as String)
  }

  public static function getQueueForCPXDelinquency(): AssignableQueue {
    return getAssignableQueueByName(ScriptParameters.getParameterValue(ASSIGNABLE_QUEUE_NAME_CPX_DELINQUENCY) as String)
  }

  public static function getQueueForPortalActivity(): AssignableQueue {
    return getAssignableQueueByName(ScriptParameters.getParameterValue(ASSIGNABLE_QUEUE_PORTAL_ACTIVITY) as String)
  }

  public static function getQueueForPortalDFAIssues(): AssignableQueue {
    return getAssignableQueueByName(ScriptParameters.getParameterValue(ASSIGNABLE_QUEUE_PORTAL_DFA_ISSUE) as String)
  }

  public static function getQueueForMigratedPolicyHoldsIssues(): AssignableQueue {
    return getAssignableQueueByName(ScriptParameters.getParameterValue(ASSIGNABLE_QUEUE_MIGRATED_POLICY_HOLD_ISSUE) as String)
  }


  public static function getQueueForServicePerformanceAndPlanning(): AssignableQueue {
    return getAssignableQueueByName(ScriptParameters.getParameterValue(ASSIGNABLE_QUEUE_SERVICE_PERFORMANCE_AND_PLANNING) as String)
  }

  public static function getQueueForIR(): AssignableQueue {
    return getAssignableQueueByName(ScriptParameters.getParameterValue(ASSIGNABLE_QUEUE_IR) as String)
  }

  public static function getQueueForRenewalEscalation(): AssignableQueue {
    return getAssignableQueueByName(ScriptParameters.getParameterValue(ASSIGNABLE_QUEUE_RENEWAL_ESCALATION) as String)
  }
  // ChrisA 30/07/2019 NTK-637 Assign Activity to queue start
  public static function getQueueForErrorMessageActivities(): AssignableQueue {
    return getAssignableQueueByName(ScriptParameters.getParameterValue(ASSIGNABLE_QUEUE_ERRORED_MESSAGES) as String)
  }

  public static function getPolicyAdministrationQueue() : AssignableQueue {
    return getAssignableQueueByName(ScriptParameters.getParameterValue(ASSIGNABLE_QUEUE_POLICY_ADMIN) as String)
  }

  public static function getLevyManagementQueue() : AssignableQueue {
    return getAssignableQueueByName(ScriptParameters.getParameterValue(ASSIGNABLE_QUEUE_LEVY_MANAGEMENT) as String)
  }

  public static function getAssignableQueuesViaScriptParameter(): List<AssignableQueue> {
    var queues = new ArrayList<AssignableQueue>()
    var qNames = (ScriptParameters.getParameterValue(ASSIGNABLE_QUEUE_NAMES) as String).split("\\|")
    qNames.each(\queueName -> {
      var queue = getAssignableQueueByName(queueName)
      if (queue != null) {
        queues.add(queue)
      }
    })
    return queues
  }

  public static function getAssignableQueues(): List<AssignableQueue> {
    return Query.make(AssignableQueue).select().toList()
  }

  public static function getAssignableQueueByName(queueName: String): AssignableQueue {
    var queue = Query.make(AssignableQueue).compare(AssignableQueue.NAME_PROP.Name, Relop.Equals, queueName)?.select()?.first()
    if (queue == null) {
      _logger.error_ACC("'${queueName}' was not found as an assignable queue - check script parameters")
    }
    return queue
  }
}