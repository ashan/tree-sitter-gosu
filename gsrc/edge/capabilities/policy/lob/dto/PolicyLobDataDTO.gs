package edge.capabilities.policy.lob.dto

uses java.util.Map
uses java.util.HashMap
uses edge.jsonmapper.JsonProperty
uses nz.co.acc.edge.capabilities.policy.lob.cp.dto.CPPolicyExtensionDTO_ACC
uses typekey.PolicyLine

class PolicyLobDataDTO {

  protected var lobExtensions : Map<typekey.PolicyLine, PolicyLineBaseDTO> = new HashMap<typekey.PolicyLine, PolicyLineBaseDTO>()

  @JsonProperty
  function getPolicyLine(policyLine : PolicyLine) : PolicyLineBaseDTO {
    return this.lobExtensions.get(policyLine)
  }
}
