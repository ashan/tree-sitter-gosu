package nz.co.acc.plm.integration.files.outbound.utils

uses gw.pl.persistence.core.Bundle
uses nz.co.acc.common.CommonUtil
uses nz.co.acc.common.integration.files.outbound.OutboundConstants
uses nz.co.acc.common.integration.files.outbound.errorhandling.OuboundHeaderErrorTemplate
uses nz.co.acc.common.integration.files.outbound.errorhandling.OuboundRecordErrorTemplate
uses nz.co.acc.plm.util.AssignableQueueUtils

/**
 * Created by nitesh.gautam on 07-Nov-17.
 */
class ActivityUtil_ACC {

  /**
   *
   * @param bundle
   * @param obrHeader
   * @param obrRecord
   * @param subject
   * @param msg
   * @param queueName - Unused in PC.  Had to add it because it was added to common.  It seems this class should also be in common rather than PC, but do not want to change this now.
   */
  static public function createOutboundFailureActivity(bundle: Bundle, obrHeader: OutBoundHeader_ACC, obrRecord: OutBoundRecord_ACC, subject: String, msg: String, queueName: String = null): void {
    var activityPattern = CommonUtil.findActivityPatternByCode(OutboundConstants.OutboundActivityPattern)
    var account: Account = null
    if (obrRecord != null) {
      account = CommonUtil.findAccountByAccID(obrRecord.AccountNumber)
    } else if (obrHeader != null) {
      // Activity.Account is mandatory in PC. A technical account is used for the batch failure cases, when a customer Account is not available.
      account = CommonUtil.findAccountByAccID(OutboundConstants.OutboundTechnicaAccountACCID)
    }

    var description: String
    if (obrRecord != null) {
      description = new OuboundRecordErrorTemplate().renderToString(obrHeader, obrRecord, msg)
    } else {
      description = new OuboundHeaderErrorTemplate().renderToString(obrHeader, msg)
    }
    var activity = activityPattern.createAccountActivity(bundle, activityPattern, account, subject, description, null, null, null, null, null)
      //updated activity assignment for new queue structure
    var errorActivityQueue = AssignableQueueUtils.getQueueForServicePerformanceAndPlanning()
    activity.assignActivityToQueue(errorActivityQueue, errorActivityQueue.getGroup())
  }
}