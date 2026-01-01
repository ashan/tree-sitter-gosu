package nz.co.acc.edge.capabilities.policy.lob.wps.dto

uses edge.capabilities.policy.dto.CoverageDTO
uses edge.capabilities.policy.lob.dto.IPolicyLobExtensionDTO
uses edge.jsonmapper.JsonProperty
uses nz.co.acc.edge.capabilities.policy.dto.BICCodeDTO_ACC
uses nz.co.acc.edge.capabilities.policy.lob.dto.PolicyLineBaseDTO_ACC

/**
 * Created by nitesh.gautam on 30-Mar-17.
 */
class WPSPolicyExtensionDTO_ACC extends PolicyLineBaseDTO_ACC implements IPolicyLobExtensionDTO {
  @JsonProperty
  var _isAEPMember: Boolean as IsAEPMember

  @JsonProperty
  var _coverageDTOs: CoverageDTO[]as CoverageDTOs

  @JsonProperty
  var _BICCodes: BICCodeDTO_ACC[]as BICCodes

}