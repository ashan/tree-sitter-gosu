package edge.capabilities.user

uses edge.capabilities.user.dto.UserDTO

interface IUserPlugin {

  public function toDTO(aUser : User) : UserDTO
}
