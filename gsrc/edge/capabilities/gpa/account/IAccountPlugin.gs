package edge.capabilities.gpa.account

uses edge.capabilities.gpa.account.dto.AccountDTO

interface IAccountPlugin {

  public function toDTO(anAccount : Account) : AccountDTO
  public function toDTOArray(accounts : Account[]) : AccountDTO[]
  public function accountBaseDetailsToDTO(anAccount : Account) : AccountDTO
  public function accountBaseDetailsToDTOArray(accounts : Account[]) : AccountDTO[]
  public function updateAccount(anAccount : Account, dto : AccountDTO)
  public function createAccount(dto : AccountDTO) : Account

}
