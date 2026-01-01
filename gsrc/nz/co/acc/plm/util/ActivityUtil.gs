package nz.co.acc.plm.util

uses entity.Activity
uses gw.plugin.util.CurrentUserUtil
uses gw.transaction.Transaction
uses gw.web.policy.RiskEvaluationPanelSetModalRowOrganizer

/**
 * Activity Util for IR and CPXLetter triggering
 */
class ActivityUtil {

  public static final var ACTIVITY_CODE_SEND_CPX_LETTER : String = "send_cpx_letter"
  public static final var ACTIVITY_CODE_AUDIT_MIGRATED_POLICY_HOLD : String = "audit_migrated_policy_hold"
  public static final var ACTIVITY_CODE_DFA_UW_RULE : String = "dfa_uw_approval_acc"
  public static final var ACTIVITY_CODE_CPX_UW_RULE : String = "cpx_uw_approval_acc"
  public static final var ACTIVITY_CODE_GENERAL : String = "general_reminder"
  private static final var ACTIVITY_CODE_MULTI_CU_CHANGE = "multi_cu_policy_period"
  private static final var ACTIVITY_CODE_SHAREHOLDER_CU_NOT_PRIMARY = "shareholder_CU_not_primary_CU"
  private static final var DFA_UWISSUE_CODE = "DelegatedFinancialAuthorityLimits_ACC"
  private static final var DFA_AUDIT_UWISSUE_CODE = "FinalAuditDFALimits_ACC"
  private static final var AUDIT_ON_HOLD_UWISSUE_CODE = "AuditOnHoldPreventReassessment_ACC"
  private static final var ON_HOLD_UWISSUE_CODE = "CodeReassessment_ACC"
  private static final var WC_DFA = "WC_DFA_ACC"
  private static final var CPX_GT = "AgreedLevelOfCover_GT_ACC"
  private static final var CPX_LE = "AgreedLevelOfCover_LE_ACC"
  private static final var CPX_DELINQUENCY = "process_cpx_delinquency_acc"

  /**
   * US247 Jaykumar : If Activity is from Defined patterns, then Escalation Date
   * will be available as Editable
   *
   * @param activity
   */
  public static function isEscalationDateEditable_ACC(activity : Activity) : boolean {
    var flag = false
    var activityPatternCodes = {
        ACTIVITY_CODE_DFA_UW_RULE, ACTIVITY_CODE_CPX_UW_RULE
    }
    if (activityPatternCodes.contains(activity.ActivityPattern.Code)) {
      flag = true
    }
    return flag
  }

  /**
   * Returns true if the activity is a DFA activity
   *
   * @param activity
   * @return
   */
  public static function isDFAActivity_ACC(activity : Activity) : boolean {
    return activity.ActivityPattern.Code == ACTIVITY_CODE_DFA_UW_RULE
  }

  /**
   * US247 Jaykumar : If policyPeriod will have active UW Issue with IssueType for CPX
   * this function will return true.
   */
  public static function isCPXUWIssue_ACC() : boolean {
    var uwIssues = RiskEvaluationPanelSetModalRowOrganizer.UWIssues
    return uwIssues.hasMatch(\elt -> elt.IssueType.Code == CPX_GT || elt.IssueType.Code == CPX_LE)
  }

  public static function isCPXUWIssueType(issue : UWIssue) : Boolean {
    return issue.IssueType.Code == CPX_GT || issue.IssueType.Code == CPX_LE
  }

  public static function isCPXUWIssueType(msg : String) : Boolean {
    return msg.containsIgnoreCase(CPX_GT) || msg.containsIgnoreCase(CPX_LE)
  }

  public static function hasCPXUWIssueType(activity : Activity) : Boolean {
    return hasCPXUWIssueType(activity?.PolicyPeriod) or activity.ActivityPattern.Code.containsIgnoreCase(ActivityUtil.ACTIVITY_CODE_CPX_UW_RULE)
  }

  public static function hasCPXUWIssueType(policyPeriod : PolicyPeriod) : Boolean {
    return policyPeriod?.UWIssuesActiveOnly?.firstWhere(\elt -> elt.IssueType.Code == ActivityUtil.CPX_LE || elt.IssueType.Code == ActivityUtil.CPX_GT) != null
  }

  public static function hasCPXDelinquencyActivityType(activity : Activity) : Boolean {
    return activity.ActivityPattern.Code == ActivityUtil.CPX_DELINQUENCY
  }

  /**
   * US247 Jaykumar : If policyPeriod will have active UW Issue with IssueType for DFA
   * this function will return true.
   */
  public static function isDFAUWIssue_ACC() : boolean {
    var uwIssues = RiskEvaluationPanelSetModalRowOrganizer.UWIssues
    return uwIssues.hasMatch(\elt -> elt.IssueType.Code == DFA_AUDIT_UWISSUE_CODE || elt.IssueType.Code == DFA_UWISSUE_CODE || elt.IssueType.Code == WC_DFA)
  }

  public static function isDFAUWIssue_ACC(issue : UWIssue) : boolean {
    return issue.IssueType.Code == DFA_AUDIT_UWISSUE_CODE || issue.IssueType.Code == DFA_UWISSUE_CODE || issue.IssueType.Code == WC_DFA
  }

  public static function isDFAUWIssue_ACC(msg : String) : boolean {
    return msg.containsIgnoreCase(DFA_AUDIT_UWISSUE_CODE) or msg.containsIgnoreCase(DFA_UWISSUE_CODE) or msg.containsIgnoreCase(WC_DFA)
  }

  /**
   * DE1698 : If policyPeriod has a hold reassessment
   * this function will return true.
   */
  public static function isPolicyHoldUWIssue_ACC() : boolean {
    var uwIssues = RiskEvaluationPanelSetModalRowOrganizer.UWIssues
    if (uwIssues.Count == 1) {
      var issue = uwIssues.first()
      return (issue.IssueType.Code == AUDIT_ON_HOLD_UWISSUE_CODE || issue.IssueType.Code == ON_HOLD_UWISSUE_CODE)
    }
    // If there are multiple issues, other issues take precedence
    return false
  }

  /**
   * Create cpxLetter Activity...
   *
   * @param job
   */
  public static function cpxLetterSubmission(job : entity.Job) {
    if (!job.AllOpenActivities.hasMatch(\act -> act.ActivityPattern.Code == ACTIVITY_CODE_SEND_CPX_LETTER)) {
      // DE1070 - Assign to the current user
      var user = User.util.getCurrentUser()
      var pattern = ActivityPattern.finder.findActivityPatternsByCode(ACTIVITY_CODE_SEND_CPX_LETTER).single()
      var subject = "Send CPX Letter"
      var description = "User to select which letter to be sent: " +
          "CPX Offer Letter, Variation of Agreement or No Letter Required."
      job.createUserActivity_ACC(pattern, subject, description, user)
    }
  }


  /**
   * Create an activity for a migrated policy hold.
   * This should never be called from a preupdate rule, since we do a commit.
   *
   * @param job
   */
  public static function createMigratedPolicyHoldActivity(job : entity.Job) {
    // Check the account instead of the job, as the job will have a new ID and hence there won't be any activities associated with it.
    if (!job.Policy.Account.AllOpenActivities.hasMatch(\act -> act.ActivityPattern.Code == ACTIVITY_CODE_AUDIT_MIGRATED_POLICY_HOLD)) {
      // DE1231 - create activity when a migrated policy is audited and on hold
      var bundle = Transaction.getCurrent()
      if (bundle != null) {
        createPolicyHoldActivity(job)
        bundle.commit()
      } else {
        Transaction.runWithNewBundle(\b -> {
          createPolicyHoldActivity(job)
        })
      }
    }
  }

  public static function createPolicyHoldActivity(job : entity.Job) {
    // DE1231 - create activity when a migrated policy is audited and on hold
    var user = User.util.getCurrentUser()
    var userName = user != null ? user.Credential.UserName : ""
    var accMigrationUser = ScriptParameters.getParameterValue("ACCMigrationUser_ACC") as String
    var pattern = ActivityPattern.finder.findActivityPatternsByCode(ACTIVITY_CODE_AUDIT_MIGRATED_POLICY_HOLD).single()
    if (userName != accMigrationUser) {
      var migratedPolicyHoldQueue = AssignableQueueUtils.getQueueForMigratedPolicyHoldsIssues()
      var activity = job.createUserActivity_ACC(pattern, pattern.Subject, pattern.Description, user)
      activity.assignActivityToQueue(migratedPolicyHoldQueue, migratedPolicyHoldQueue.getGroup())
      // The activity pattern is specific to audit, so for policy change we need to change the subject & description
      if (job.Subtype == TC_POLICYCHANGE) {
        activity.Description = "Policy is on hold and is a migrated policy"
        activity.Subject = "Policy is migrated and has a hold"
        // We need to commit because otherwise the activity & pending transaction will get rolled back.
      }
    }
  }

  /**
   * This is for an account where default CU code is applied
   *
   * @param account
   */
  public static function createCUReviewActivity(account : Account) {
    var createAssignedCUActivity = ScriptParameters.getParameterValue("CreateAssignedCUActivity_ACC") as boolean
    if (createAssignedCUActivity) {
      var pattern = "general_reminder"
      var subject = "Assigned CU"
      var description = "Customer has an assigned CU/BIC. Classification investigation required."
      if (account.AllOpenActivities.hasMatch(\act -> act.ActivityPattern.Code == pattern and act.Subject.equalsIgnoreCase(subject))) {
        return
      }
      var activityPattern = ActivityPattern.finder.findActivityPatternsByCode(pattern).single()
      var activity = account.newActivity(activityPattern)
      activity.Subject = subject
      activity.Description = description
      var queue = AssignableQueueUtils.getQueueForIR()
      activity.assignActivityToQueue(queue, queue.getGroup())
    }
  }

  /**
   * If shareholder has a different CU to the primary (when processing shareholder earnings through IR)
   *
   * @param account
   * @param inbound
   */
  public function shareholderCUDifferentFromPrimary(account : Account, inboundRecordPublicID : String) {
    createIRActivity(account, inboundRecordPublicID, ACTIVITY_CODE_SHAREHOLDER_CU_NOT_PRIMARY)
  }

  private function createIRActivity(account : Account, inboundRecordPublicID : String, pattern : String) {
    if (account.AllOpenActivities.hasMatch(\act -> act.ActivityPattern.Code == pattern)) {
      return
    }
    var activityPattern = ActivityPattern.finder.findActivityPatternsByCode(pattern).single()
    var activity = account.newActivity(activityPattern)
    activity.InboundRecordID_ACC = inboundRecordPublicID
    var queue = AssignableQueueUtils.getQueueForIR()
    activity.assignActivityToQueue(queue, queue.getGroup())
  }

  /**
   * NTK-663 / NTK-1255
   * User should be able to
   * 1. Assign the activity to themselves from the account or policy level if it assigned to a queue the user is a member of
   * 2. View the activity in a "read only" state if the activity is already assigned to a user or is assigned to a queue the user is not a member of.
   *
   * @param activity
   * @return
   */
  public static function canAssignActivityToSelf(activity : Activity) : boolean {
    return activity.AssignedQueue != null
        && activity.AssignedUser == null
        && CurrentUserUtil.CurrentUser.User.AllGroups.contains(activity.AssignedQueue.Group)
  }

  public static function assignToCurrentUser(activity : Activity) {
    var user = CurrentUserUtil.CurrentUser.User
    var currentQueueGroup = activity.AssignedQueue.Group
    gw.transaction.Transaction.runWithNewBundle(\bundle -> {
      activity = bundle.add(activity)
      activity.assign(currentQueueGroup ?: user.DefaultAssignmentGroup, user)
    }, "sys")
  }

  /**
   * Workaround for known Guidewire defect (NTK-663)
   * <p>
   * Default Guidewire behaviour is to always mark activity as viewed when it is opened,
   * but that will fail if the user only has 'view' permission for the activity.
   *
   * @param activity
   */
  public static function markActivityAsViewed(activity : Activity) {
    if (perm.Activity.edit(activity)) {
      gw.api.web.activity.ActivityUtil.markActivityAsViewed(activity)
    }
  }

  public static function deriveActivityPattern(msg : String) : String {
    if (ActivityUtil.isDFAUWIssue_ACC(msg)) {
      return ActivityUtil.ACTIVITY_CODE_DFA_UW_RULE
    } else if (ActivityUtil.isCPXUWIssueType(msg)) {
      return ActivityUtil.ACTIVITY_CODE_CPX_UW_RULE
    }
    return ActivityUtil.ACTIVITY_CODE_GENERAL
  }
}
