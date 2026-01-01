package edge.capabilities.gpa.policy

uses edge.capabilities.gpa.policy.dto.PolicyLineDTO

interface IPolicyLinePlugin {

  public function toDTO(aPolicyLine : PolicyLine) : PolicyLineDTO
  public function getPolicyLines(aPolicyPeriod : PolicyPeriod) : PolicyLineDTO[]

}
