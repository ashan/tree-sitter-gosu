package nz.co.acc.edge.capabilities.policy.lob.wpc.dto

uses edge.capabilities.policy.lob.dto.PolicyLobDataDTO
uses edge.jsonmapper.JsonProperty
uses nz.co.acc.edge.capabilities.policy.lob.wpc.dto.WPCPolicyExtensionDTO_ACC
uses typekey.*

/**
 * Created by nitesh.gautam on 27-Mar-17.
 */
enhancement WPCPolicyLobDataDTOEnhancement_ACC: PolicyLobDataDTO {

  @JsonProperty
  property get wpc() : WPCPolicyExtensionDTO_ACC {
    return this.lobExtensions.get(typekey.PolicyLine.TC_EMPWPCLINE) as WPCPolicyExtensionDTO_ACC
  }

  @JsonProperty
  property set wpc(data : WPCPolicyExtensionDTO_ACC) {
    this.lobExtensions.put(typekey.PolicyLine.TC_EMPWPCLINE, data)
  }

}
