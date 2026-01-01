package nz.co.acc.plm.integration.bulkupload.csvtypes.activity

/**
 * Created by ManubaF on 26/02/2019.
 */
class CompleteCancelActivity {
  public var accNumber: String as AccountACCNumber = null
  public var completeCancel: String as CompleteCancel = null
  public var subject: String as ActivitySubject = null
  public var description: String as ActivityDescription = null
  public var creationDate: Date as ActivityCreationDate = null
  public var dueDate: Date as ActivityDueDate = null
  public var escalationDate: Date as ActivityEscalationDate = null
  public var priority: Priority as ActivityPriority = null
  public var recurring: Boolean as ActivityRecurring = null
  public var queue: String as ActivityQueueOrUser = null
  public var user: String as AssignedUser = null

  @Override
  function toString() : String {
      return "CompleteCancelActivity{" +
          "accNumber='" + accNumber + '\'' +
          ", completeCancel='" + completeCancel + '\'' +
          ", subject='" + subject + '\'' +
          ", description='" + description + '\'' +
          ", creationDate=" + creationDate +
          ", dueDate=" + dueDate +
          ", escalationDate=" + escalationDate +
          ", priority=" + priority +
          ", recurring=" + recurring +
          ", queue=" + queue +
          ", user=" + user +
          '}';
      }}