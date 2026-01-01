package edge.capabilities.gpa.account.dto

uses edge.jsonmapper.JsonProperty
uses edge.capabilities.gpa.policy.dto.PolicySummaryDTO
uses edge.capabilities.gpa.billing.dto.AccountBillingSummaryDTO
uses java.util.Date
uses edge.capabilities.gpa.user.dto.ProducerCodeDTO
uses java.lang.Integer
uses edge.capabilities.policycommon.accountcontact.dto.AccountContactDTO
uses edge.capabilities.gpa.currency.dto.CurrencyDTO

class AccountDTO {

  @JsonProperty
  var _publicID : String as PublicID

  @JsonProperty
  var _accountNumber : String as AccountNumber

  @JsonProperty
  var _accountHolder : AccountContactDTO as AccountHolder

  @JsonProperty
  var _accountBillingSummary : AccountBillingSummaryDTO as AccountBillingSummary

  @JsonProperty
  var _producerCodes : ProducerCodeDTO[] as ProducerCodes

  @JsonProperty
  var _policySummaries : PolicySummaryDTO[] as PolicySummaries

  @JsonProperty
  var _canUserView : Boolean as CanUserView

  @JsonProperty
  var _canUserCreateSubmission : Boolean as CanUserCreateSubmission

  @JsonProperty
  var _accountCreatedDate : Date as AccountCreatedDate

  @JsonProperty
  var _numberOfOpenActivities : Integer as NumberOfOpenActivities

  @JsonProperty
  var _numberOfNotes : Integer as NumberOfNotes

  @JsonProperty
  var _numberOfOpenDocuments : Integer as NumberOfDocuments

  @JsonProperty
  var _numberOfOpenClaims : Integer as NumberOfOpenClaims

  @JsonProperty
  var _numberOfWorkOrders : Integer as NumberOfWorkOrders

  @JsonProperty
  var _numberOfOpenQuotes : Integer as NumberOfOpenQuotes

  @JsonProperty
  var _numberOfOpenPolicyRenewals : Integer as NumberOfOpenPolicyRenewals

  @JsonProperty
  var _numberOfOpenPolicyCancellations : Integer as NumberOfOpenPolicyCancellations

  @JsonProperty
  var _numberOfOpenPolicyChanges : Integer as NumberOfOpenPolicyChanges

  @JsonProperty
  var _status : String as StatusDisplayName

  @JsonProperty
  var _totalPremium : CurrencyDTO as TotalPremium


}
