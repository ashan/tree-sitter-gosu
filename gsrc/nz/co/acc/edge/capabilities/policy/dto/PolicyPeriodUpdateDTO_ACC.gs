package nz.co.acc.edge.capabilities.policy.dto

uses edge.aspects.validation.annotations.Required
uses edge.jsonmapper.JsonProperty
uses nz.co.acc.edge.capabilities.policy.lob.dto.PolicyLineBaseDTO_ACC

/**
 * Created by Franklin Manubag on 16/5/2020.
 */
class PolicyPeriodUpdateDTO_ACC {
  @JsonProperty @Required
  var _policyNumber : String as PolicyNumber

  @JsonProperty
  var _ceasedTradingDate : Date as CeasedTradingDate

  @JsonProperty
  var _levyYear : Integer as LevyYear

  @JsonProperty
  var _jobNumber : String as JobNumber

  @JsonProperty
  var _lobs : PolicyLineBaseDTO_ACC[] as Lobs
}