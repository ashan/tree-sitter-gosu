package edge.capabilities.user

uses edge.capabilities.user.dto.UserDTO
uses edge.di.annotations.ForAllGwNodes
uses edge.capabilities.address.IAddressPlugin

class DefaultUserPlugin implements IUserPlugin {

  var _addressPlugin : IAddressPlugin

  @ForAllGwNodes
  construct(addressPlugin : IAddressPlugin){
     this._addressPlugin = addressPlugin
  }

  override function toDTO(aUser: User): UserDTO {
    final var dto = new UserDTO()
    fillBaseProperties(dto, aUser)
    dto.PrimaryAddress = _addressPlugin.toDto(aUser.Contact.PrimaryAddress)

    return dto
  }

  public static function fillBaseProperties(dto : UserDTO, aUser : User){
    dto.FirstName = aUser.Contact.FirstName
    dto.LastName = aUser.Contact.LastName
    dto.Email = aUser.Contact.EmailAddress1
    dto.PublicID = aUser.PublicID
    dto.DisplayName = aUser.DisplayName
    dto.PhoneNumber = aUser.Contact.PrimaryPhoneValue
    dto.UserType = aUser.UserType as String
  }
}
