package edge.capabilities.policychange.dto

uses edge.aspects.validation.annotations.Context
uses edge.el.Expr
uses edge.jsonmapper.JsonProperty

@Context("policyCountry",Expr.getProperty("Country",Expr.getProperty("PolicyAddress",Context.VALUE)))
class PolicyChangeDTO extends TransactionDTO {
  /**  Changes between this policy change and the policy it is based on. */
  @JsonProperty
  var _history : PolicyChangeHistoryDTO[] as History

}
