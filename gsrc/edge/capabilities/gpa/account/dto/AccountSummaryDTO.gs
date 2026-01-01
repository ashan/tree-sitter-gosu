package edge.capabilities.gpa.account.dto

uses edge.jsonmapper.JsonProperty
uses edge.capabilities.gpa.policy.dto.PolicySummaryDTO
uses java.util.Date
uses edge.capabilities.address.dto.AddressDTO

class AccountSummaryDTO {

  @JsonProperty
  var _accountNumber : String as AccountNumber

  @JsonProperty
  var _accountHolderName : String as AccountHolder

  @JsonProperty
  var _accountHolderAddress : AddressDTO as AccountHolderAddress

  @JsonProperty
  var _producerCodes : String[] as ProducerCodes

  @JsonProperty
  var _policySummaries : PolicySummaryDTO[] as PolicySummaries

  @JsonProperty
  var _accountCreatedDate : Date as AccountCreatedDate

  @JsonProperty
  var _numberOfOpenActivities : int as NumberOfOpenActivities

  @JsonProperty
  var _isPersonalAccount : Boolean as IsPersonalAccount

  @JsonProperty
  var _isCommercialAccount : Boolean as IsCommercialAccount

  @JsonProperty
  var _createdByMe : Boolean as CreatedByMe

}
