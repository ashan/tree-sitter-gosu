package edge.capabilities.gpa.account

uses edge.capabilities.gpa.account.dto.AccountSummaryDTO

interface IAccountSummaryPlugin {

  public function toDTO(anAccount : Account) : AccountSummaryDTO
  public function toDTOArray(accounts : Account[]) : AccountSummaryDTO[]

}
