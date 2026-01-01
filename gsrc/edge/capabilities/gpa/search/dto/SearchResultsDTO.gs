package edge.capabilities.gpa.search.dto

uses edge.jsonmapper.JsonProperty
uses edge.capabilities.gpa.account.dto.AccountDTO
uses edge.capabilities.gpa.policy.dto.PolicyDTO

class SearchResultsDTO {

  @JsonProperty
  var _accounts : AccountDTO[] as Accounts

  @JsonProperty
  var _policies : PolicyDTO[] as Policies

}
