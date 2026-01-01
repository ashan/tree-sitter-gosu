package nz.co.acc.edge.capabilities.gpa.account.dto

uses edge.PlatformSupport.Bundle
uses gw.api.locale.DisplayKey
uses nz.co.acc.common.edge.security.permission.BCSSUser_ACC
uses nz.co.acc.plm.util.AssignableQueueUtils

/**
 * Created by lee.teoh on 13/06/2017.
 */
enhancement ActivityDTO_ACCEnhancement: ActivityDTO_ACC {

  /**
   * Creates an ActivityDTO_ACC from a platform activity
   * @param activity the activity to create the dto from
   * @return
   */
  static function fromActivity(activity : Activity) : ActivityDTO_ACC{
    var newActivity = new ActivityDTO_ACC()
    newActivity.ActivityID = activity.PublicID
    newActivity.Subject = activity.Subject
    newActivity.Description = activity.Description
    return newActivity
  }

  /**
   * Creates an activity
   * @param subject subject for the activity
   * @param description description for the activity
   * @param job the job that this activity is related to
   * @param user the BCSS user that was passed in from the json rpc call header
   * @return
   */
  static function createActivityForJob(subject : String, description : String, job: Job, user : BCSSUser_ACC)
      : Activity{
    var activity : Activity
    Bundle.resolveInTransaction(\bundle -> {
      var portalDFAIssuesQueue = AssignableQueueUtils.getQueueForPortalDFAIssues()
      activity = ActivityPattern.finder.getActivityPatternByCode("approve_general")
          .createJobActivity(bundle.PlatformBundle, job, subject, description, user.FullName, null, null, null, null)
      activity.assignActivityToQueue(portalDFAIssuesQueue, portalDFAIssuesQueue.getGroup())
      return activity
    })
    return activity
  }

}
