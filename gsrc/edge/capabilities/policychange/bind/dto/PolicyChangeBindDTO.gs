package edge.capabilities.policychange.bind.dto

uses edge.capabilities.policychange.dto.TransactionDTO
uses edge.jsonmapper.JsonProperty
uses edge.capabilities.policychange.dto.PolicyChangeDTO
uses edge.aspects.validation.annotations.Required

class PolicyChangeBindDTO extends TransactionBindDTO {

  /** Indicates whether or not the changes made were automatically merged forward to a future unbound renewal. */
  @JsonProperty
  @Required
  var _changesAppliedForward : boolean as ChangesAppliedForward
}
