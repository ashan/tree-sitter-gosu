package nz.co.acc.edge.capabilities.policy.lob.cp.dto

uses edge.capabilities.policy.lob.dto.PolicyLobDataDTO
uses edge.jsonmapper.JsonProperty
uses nz.co.acc.edge.capabilities.policy.lob.cp.dto.CPPolicyExtensionDTO_ACC

/**
 * Created by nitesh.gautam on 27-Mar-17.
 */
enhancement CPPolicyLobDataDTOEnhancement_ACC: PolicyLobDataDTO {

  @JsonProperty
  property get cp() : CPPolicyExtensionDTO_ACC {
    return this.lobExtensions.get(typekey.PolicyLine.TC_INDCOPLINE) as CPPolicyExtensionDTO_ACC
  }

  @JsonProperty
  property set cp(data : CPPolicyExtensionDTO_ACC) {
    this.lobExtensions.put(typekey.PolicyLine.TC_INDCOPLINE, data)
  }

}
