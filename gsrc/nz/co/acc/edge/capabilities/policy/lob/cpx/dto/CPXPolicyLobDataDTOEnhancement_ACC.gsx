package nz.co.acc.edge.capabilities.policy.lob.cpx.dto

uses edge.capabilities.policy.lob.dto.PolicyLobDataDTO
uses edge.jsonmapper.JsonProperty
uses nz.co.acc.edge.capabilities.policy.lob.cp.dto.CPPolicyExtensionDTO_ACC
uses nz.co.acc.edge.capabilities.policy.lob.cpx.dto.CPXPolicyExtensionDTO_ACC
uses typekey.*
uses typekey.PolicyLine

/**
 * Created by nitesh.gautam on 30-Mar-17.
 */
enhancement CPXPolicyLobDataDTOEnhancement_ACC: PolicyLobDataDTO {
  @JsonProperty
  property get cpx() : CPXPolicyExtensionDTO_ACC {
    return this.lobExtensions.get(typekey.PolicyLine.TC_INDCPXLINE) as CPXPolicyExtensionDTO_ACC
  }

  @JsonProperty
  property set cpx(data : CPXPolicyExtensionDTO_ACC) {
    this.lobExtensions.put(PolicyLine.TC_INDCPXLINE, data)
  }

}
