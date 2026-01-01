package nz.co.acc.edge.capabilities.gpa.activity

uses edge.PlatformSupport.Bundle
uses edge.PlatformSupport.Logger
uses edge.PlatformSupport.Reflection
uses edge.capabilities.gpa.account.IAccountRetrievalPlugin
uses edge.capabilities.gpa.activity.ActivityHandler
uses edge.capabilities.gpa.activity.IActivityPatternPlugin
uses edge.capabilities.gpa.activity.IActivityPlugin
uses edge.capabilities.gpa.activity.dto.ActivityDTO
uses edge.capabilities.gpa.activity.dto.ActivityPatternDTO
uses edge.capabilities.gpa.note.INotePlugin
uses edge.capabilities.helpers.ActivityUtil
uses edge.capabilities.helpers.JobUtil
uses edge.capabilities.helpers.PolicyUtil
uses edge.di.annotations.InjectableNode
uses edge.jsonrpc.annotation.JsonRpcMethod
uses edge.jsonrpc.annotation.JsonRpcRunAsInternalGWUser
uses gw.util.GosuStringUtil
uses nz.co.acc.edge.capabilities.helpers.AccountUtil_ACC

/**
 * ACC Activity Handler API.
 */
class ActivityHandler_ACC extends ActivityHandler {
  final private static var LOGGER = new Logger(Reflection.getRelativeName(ActivityHandler_ACC))
  private var _jobHelper: JobUtil

  @InjectableNode
  construct(
      anActivityPlugin : IActivityPlugin,
      notePlugin : INotePlugin,
      anActivityPatternPlugin : IActivityPatternPlugin,
      anActivityHelper : ActivityUtil,
      aPolicyHelper : PolicyUtil,
      aJobHelper : JobUtil,
      anAccountRetrievalPlugin : IAccountRetrievalPlugin) {
    super(anActivityPlugin, notePlugin, anActivityPatternPlugin, anActivityHelper, aPolicyHelper, aJobHelper, anAccountRetrievalPlugin);
    _jobHelper = aJobHelper
  }

  /**
   * Creates an activity based on the activityDTO parameter
   * @param activityDTO the activity to create
   * @return the created activity
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function createActivity(activityDTO : ActivityDTO) : ActivityDTO {

    // default activity pattern must be set
    activityDTO.ActivityPattern = new ActivityPatternDTO()
    activityDTO.ActivityPattern.Code = "general_reminder"

    // validate DTO
    var credentialCount = 0
    if (GosuStringUtil.isNotBlank(activityDTO.SelectedAssigneeUser)) credentialCount += 1
    if (GosuStringUtil.isNotBlank(activityDTO.SelectedAssigneeGroup)) credentialCount += 1
    if (GosuStringUtil.isNotBlank(activityDTO.SelectedAssigneeQueue)) credentialCount += 1
    if (credentialCount == 0) {
      throw new RuntimeException("Must specify a selected assignee user/group/queue")
    } else if (credentialCount > 1) {
      throw new RuntimeException("Must specify only one selected assignee user/group/queue")
    }
    if (GosuStringUtil.isBlank(activityDTO.AccountNumber) and
        GosuStringUtil.isBlank(activityDTO.PolicyNumber) and
        GosuStringUtil.isBlank(activityDTO.JobNumber)) {
      throw new RuntimeException("Must provide account number, policy number or job number")
    }

    if(GosuStringUtil.isNotBlank(activityDTO.AccountNumber) and
       GosuStringUtil.isNotBlank(activityDTO.PolicyNumber) and
       GosuStringUtil.isNotBlank(activityDTO.JobNumber) ) {
      throw new RuntimeException("Must provide only one of account number, policy number or job number")
    }

    if(GosuStringUtil.isNotBlank(activityDTO.JobNumber) and
       _jobHelper.findJobByJobNumber(activityDTO.JobNumber).LatestPolicyPeriod.Status != PolicyPeriodStatus.TC_DRAFT) {
      throw new RuntimeException("Transaction should be in draft state")
    }

    if (GosuStringUtil.isBlank(activityDTO.Subject)) {
      throw new RuntimeException("Subject must not be blank")
    }
    if (activityDTO.EscalationDate != null and activityDTO.DueDate != null) {
      if (activityDTO.EscalationDate.before(activityDTO.DueDate)) {
        throw new RuntimeException("Escalation date cannot be before due date")
      }
    }

    // create activity
    final var activity = Bundle.resolveInTransaction(\bundle -> {
      var activity = createActivity(activityDTO, bundle)

      // assign activity
      if (activity != null) {
        if (GosuStringUtil.isNotBlank(activityDTO.SelectedAssigneeUser)) {
          var user = AccountUtil_ACC.findUserByCredential(activityDTO.SelectedAssigneeUser)
          var success = activity.assignUserAndDefaultGroup(user)
          if (not success) {
            throw new RuntimeException("Failed to assign activity to user ${activityDTO.SelectedAssigneeUser}")
          }

        } else if (GosuStringUtil.isNotBlank(activityDTO.SelectedAssigneeGroup)) {
          var group = AccountUtil_ACC.findGroup(activityDTO.SelectedAssigneeGroup)
          var success = activity.assignGroup(group)
          if (not success) {
            throw new RuntimeException("Failed to assign activity to group ${activityDTO.SelectedAssigneeGroup}")
          }

        } else if (GosuStringUtil.isNotBlank(activityDTO.SelectedAssigneeQueue)) {
          var queue = AccountUtil_ACC.findAssignableQueue(activityDTO.SelectedAssigneeQueue)
          activity.assignToQueue(queue)
        }
      }
      return activity
    })

    if (activity != null) {
      return _activityPlugin.toDTO(activity)
    } else {
      return new ActivityDTO()
    }
  }

}
