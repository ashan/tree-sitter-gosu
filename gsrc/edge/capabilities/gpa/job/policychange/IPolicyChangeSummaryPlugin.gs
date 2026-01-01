package edge.capabilities.gpa.job.policychange

uses edge.capabilities.gpa.job.policychange.dto.PolicyChangeSummaryDTO

interface IPolicyChangeSummaryPlugin {

  public function toDTO(aPolicyChange : PolicyChange) : PolicyChangeSummaryDTO
}
