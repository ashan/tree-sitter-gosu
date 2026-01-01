package edge.capabilities.gpa.job.policychange

uses edge.capabilities.gpa.job.policychange.dto.PolicyChangeDTO
uses java.util.Date
uses edge.capabilities.gpa.job.dto.UWIssueDTO

interface IPolicyChangePlugin {

  public function toDTO(aPolicyChange : PolicyChange) : PolicyChangeDTO
  public function toDTOArray(policyChanges : PolicyChange[]) : PolicyChangeDTO[]
  public function startPolicyChange(aPolicy : Policy, dto : PolicyChangeDTO) : PolicyChange
  public function getEffectiveDateForPolicyChange(aPolicy : Policy) : Date
  public function getUWIssuesForPolicyChange(aPolicyChange : PolicyChange) : UWIssueDTO[]
  public function referToUnderwriter(aPolicyChange : PolicyChange, noteForUnderwriter : String): PolicyChange

}
