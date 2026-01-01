package edge.capabilities.gpa.policy

uses edge.capabilities.gpa.policy.dto.PolicyPeriodDTO

interface IPolicyPeriodPlugin {

  public function toDTO(aPolicyPeriod : PolicyPeriod) : PolicyPeriodDTO
  public function toDTOArray(policyPeriods : PolicyPeriod[]) : PolicyPeriodDTO[]

}
