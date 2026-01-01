package nz.co.acc.plm.integration.bulkupload.csvtypes

/**
 * Created by ManubaF on 23/01/2019.
 */
class ActivityUploadDTO {
  public var accNumber: String as ACCNumber = null
  public var accountOrPolicyLevel: String as AccountOrPolicyLevel = null
  public var suffix: String as Suffix = null
  public var subject: String as Subject = null
  public var description: String as Description = null
  public var dueDate: Date as DueDate = null
  public var escalationDate: Date as EscalationDate = null
  public var priority: Priority as Priority = null
  public var recurring: Boolean as Recurring = null
  public var assignedQueue: String as AssignedQueue = null
//  public var activityPattern: String as ActivityPattern = null

  property get IsAccountActivity(): boolean {
    return accountOrPolicyLevel.equalsIgnoreCase("A")
  }

  public override function toString(): String {
    return "ActivityUploadDTO{" +
        "accNumber='" + accNumber + '\'' +
        ", accountOrPolicyLevel ='" + accountOrPolicyLevel + '\'' +
        ", suffix='" + suffix + '\'' +
        ", subject=" + subject +
        ", description=" + description +
        ", dueDate=" + dueDate +
        ", escalationDate=" + escalationDate +
        ", priority=" + priority +
        ", recurring=" + recurring +
        ", assignedQueue='" + assignedQueue + '\'' +
//        ", activityPattern='" + activityPattern + '\'' +
        '}';
  }
}