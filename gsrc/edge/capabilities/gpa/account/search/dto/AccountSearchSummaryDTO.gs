package edge.capabilities.gpa.account.search.dto

uses java.lang.Integer
uses edge.jsonmapper.JsonProperty
uses edge.capabilities.gpa.account.dto.AccountSummaryDTO

class AccountSearchSummaryDTO {

  @JsonProperty
  var _maxNumberOfResults : Integer as MaxNumberOfResults

  @JsonProperty
  var _accounts : AccountSummaryDTO[] as Accounts
}
