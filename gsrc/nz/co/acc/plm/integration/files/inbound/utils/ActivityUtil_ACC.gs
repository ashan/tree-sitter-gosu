package nz.co.acc.plm.integration.files.inbound.utils

uses gw.pl.persistence.core.Bundle
uses nz.co.acc.common.CommonUtil
uses entity.Activity
uses nz.co.acc.plm.util.AssignableQueueUtils
uses org.joda.time.LocalDate

/**
 * Created by nitesh.gautam on 07-Nov-17.
 */
class ActivityUtil_ACC {

  public static final var InboundActivityPattern :String = "inbound_failure"
  public static final var InboundTechnicaAccountACCID:String = "TechAccount002"

  static public function createInboundFailureActivity(bundle: Bundle, account: Account, subject: String): void {
    var activityPattern = CommonUtil.findActivityPatternByCode(InboundActivityPattern)
    if (account== null) {
      account = CommonUtil.findAccountByAccID(InboundTechnicaAccountACCID)
    }
    var activity = activityPattern.createAccountActivity(bundle,activityPattern,account,subject,subject,null, null, null, null, null)
    //updated activity assignment for new queue structure
    var errorActivityQueue = AssignableQueueUtils.getQueueForServicePerformanceAndPlanning()
    activity.assignActivityToQueue(errorActivityQueue, errorActivityQueue.getGroup())
  }
}