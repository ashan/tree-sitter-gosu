package edge.capabilities.gpa.policy

uses edge.capabilities.gpa.policy.dto.PolicySummaryDTO

interface IPolicySummaryPlugin {

  public function toDTO(aPolicyPeriod : PolicyPeriod, checkDelinquencyStatus : boolean) : PolicySummaryDTO
  public function toDTOArray(policies : Policy[], checkDelinquencyStatus : boolean) : PolicySummaryDTO[]
}
