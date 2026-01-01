package edge.capabilities.policychange.bind.dto

uses edge.aspects.validation.annotations.Required
uses edge.capabilities.policychange.dto.TransactionDTO
uses edge.jsonmapper.JsonProperty

/**
 * Created by Franklin Manubag on 20/10/2019.
 */
class TransactionBindDTO {

  @JsonProperty
  @Required
  var _transaction : TransactionDTO as Transaction

  var _job : Job as Job
}