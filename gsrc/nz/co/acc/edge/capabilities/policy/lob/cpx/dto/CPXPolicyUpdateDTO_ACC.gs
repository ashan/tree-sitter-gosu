package nz.co.acc.edge.capabilities.policy.lob.cpx.dto

uses edge.capabilities.policy.lob.dto.IPolicyLobExtensionDTO
uses edge.jsonmapper.JsonProperty
uses nz.co.acc.edge.capabilities.policy.dto.BICCodeDTO_ACC
uses nz.co.acc.edge.capabilities.policy.dto.CoverableDTO_ACC
uses nz.co.acc.edge.capabilities.policy.lob.dto.PolicyLineBaseDTO_ACC

/**
 * Created by nitesh.gautam on 30-Mar-17.
 */
class CPXPolicyUpdateDTO_ACC extends PolicyLineBaseDTO_ACC implements IPolicyLobExtensionDTO {
  @JsonProperty
  var _employmentStatus : String as EmploymentStatus

  @JsonProperty
  var _businessStructure : String as BusinessStructure
}