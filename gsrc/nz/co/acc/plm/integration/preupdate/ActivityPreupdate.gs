package nz.co.acc.plm.integration.preupdate

uses entity.Activity
uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.history.CustomHistoryHelper_ACC
uses nz.co.acc.plm.util.ActivityUtil

uses gw.surepath.suite.integration.logging.StructuredLogger

/**
 * preUpdate rule for Activity
 */
class ActivityPreupdate {


  /**
   * The rules for activity
   *
   * @param entity
   */
  public static function executePreUpdate(entity : KeyableBean) {
    if (entity typeis Activity) {
      CustomHistoryHelper_ACC.addActivityAssignmentHistory(entity)
      cpxActivityCompleted(entity)
      cpxActivityCancelled(entity)
      deceasedActivityCompleted(entity)
    }
  }

  /**
   * Trigger cpx letter workflow here
   */
  private static function cpxActivityCompleted(activity : Activity) {
    var cpxWorkFlowTrigger = false

    if (activity.ActivityPattern.Code == ActivityUtil.ACTIVITY_CODE_SEND_CPX_LETTER
        && activity.isFieldChanged(Activity#Status)
        && activity.Status == ActivityStatus.TC_COMPLETE
        && activity.Job != null) {
      if (activity.LetterToBeSent_ACC == null) {
        throw new DisplayableException("Letter to be sent : Missing required field Letter to be sent")
      } else if (activity.LetterToBeSent_ACC == LetterToBeSent_ACC.TC_CPX_OFFER_LETTER) {
        cpxWorkFlowTrigger = true
      }

    }
    if (cpxWorkFlowTrigger) {
      CPXNewSubmissionLetter_ACC.createWorkflow(activity.Job.LatestPeriod, activity.Bundle)
    }
  }

  /**
   * Stop cpx letter workflow here
   */
  private static function cpxActivityCancelled(activity : Activity) {
    if (activity.ActivityPattern.Code == ActivityUtil.ACTIVITY_CODE_SEND_CPX_LETTER
        && activity.isFieldChanged(Activity#Status)
        && activity.Status == ActivityStatus.TC_CANCELED
        && activity.Job != null) {
      CPXNewSubmissionLetter_ACC.stopCPXNewSubmissionLetterWorkflow(activity.Job.LatestPeriod, activity.Bundle)
    }
  }

  /**
   * Trigger Deceased Letter
   */
  private static function deceasedActivityCompleted(activity : Activity) {
    var functionName = "deceasedActivityCompleted"
    if (activity?.Account.StatusOfAccount_ACC == StatusOfAccount_ACC.TC_DECEASED && activity.Subject == DisplayKey.get("Web.AccountStatus.NewActivity.Deceased_ACC")
        && activity.isFieldChanged(Activity#Status)
        && activity.Status == ActivityStatus.TC_COMPLETE) {
      StructuredLogger.INTEGRATION.info( ActivityPreupdate.Type + " " + functionName + " " + "Deceased letter should be generated here****" + "statusOfAccount=" + activity.Account.StatusOfAccount_ACC + "/n" + "  Account number=" + activity.Account.AccountNumber + "/n" + "Activity Subject=" + activity.Subject)
    }
  }
}