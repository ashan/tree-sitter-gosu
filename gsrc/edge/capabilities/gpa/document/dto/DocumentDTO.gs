package edge.capabilities.gpa.document.dto

uses edge.capabilities.document.dto.DocumentBaseDTO
uses edge.jsonmapper.JsonProperty

class DocumentDTO extends DocumentBaseDTO {
  @JsonProperty
  var _accountNumber : String as AccountNumber

  @JsonProperty
  var _policyNumber : String as PolicyNumber

  @JsonProperty
  var _jobNumber : String as JobNumber

  @JsonProperty
  var _level : String as Level

  @JsonProperty
  var _canDelete : Boolean as CanDelete
}
