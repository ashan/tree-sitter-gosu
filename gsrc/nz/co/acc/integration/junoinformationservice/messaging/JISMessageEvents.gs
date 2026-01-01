package nz.co.acc.integration.junoinformationservice.messaging

/**
 * Created by Mike Ourednik on 14/05/20.
 */
class JISMessageEvents {
  public static final var EVENT_ACCOUNT_CHANGE : String = "AccountChangeJIS_ACC"
  public static final var EVENT_ACCOUNT_CHANGE_LATEST_POLICY : String = "AccountChangeLatestPolicyJIS_ACC"
  public static final var EVENT_ACCOUNT_CHANGE_RENEWAL : String = "AccountChangeRenewalJIS_ACC"
  public static final var EVENT_POLICY_CHANGE : String = "PolicyChangeJIS_ACC"
  public static final var EVENT_POLICY_CHANGE_RENEWAL : String = "PolicyChangeRenewalJIS_ACC"
  public static final var EVENT_DOCUMENT_ADDED : String = "DocumentAdded"
  public static final var EVENT_DOCUMENT_CHANGED : String = "DocumentChanged"
  public static final var EVENT_DOCUMENT_REMOVED : String = "DocumentRemoved"
}