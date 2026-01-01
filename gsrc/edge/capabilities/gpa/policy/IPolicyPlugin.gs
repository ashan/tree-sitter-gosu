package edge.capabilities.gpa.policy

uses edge.capabilities.gpa.policy.dto.PolicyDTO

interface IPolicyPlugin {

  public function toDTO(aPolicy : Policy) : PolicyDTO
  public function toDTOArray(policies : Policy[]) : PolicyDTO[]
  public function policyBaseDetailsToDTO(aPolicy : Policy) : PolicyDTO
  public function policyBaseDetailsToDTOArray(policies : Policy[]) : PolicyDTO[]

}
