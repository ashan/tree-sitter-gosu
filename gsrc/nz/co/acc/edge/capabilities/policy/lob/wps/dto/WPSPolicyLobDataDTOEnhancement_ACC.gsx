package nz.co.acc.edge.capabilities.policy.lob.wps.dto

uses edge.capabilities.policy.lob.dto.PolicyLobDataDTO
uses edge.jsonmapper.JsonProperty
uses typekey.*
uses typekey.PolicyLine

/**
 * Created by nitesh.gautam on 27-Mar-17.
 */
enhancement WPSPolicyLobDataDTOEnhancement_ACC: PolicyLobDataDTO {

  @JsonProperty
  property get wps() : WPSPolicyExtensionDTO_ACC {
    return this.lobExtensions.get(typekey.PolicyLine.TC_CWPSLINE) as WPSPolicyExtensionDTO_ACC
  }

  @JsonProperty
  property set wps(data : WPSPolicyExtensionDTO_ACC) {
    this.lobExtensions.put(PolicyLine.TC_CWPSLINE, data)
  }

}
