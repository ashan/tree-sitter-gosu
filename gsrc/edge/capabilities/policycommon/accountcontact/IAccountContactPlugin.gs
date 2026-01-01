package edge.capabilities.policycommon.accountcontact

uses edge.capabilities.policycommon.accountcontact.dto.AccountContactDTO

interface IAccountContactPlugin {

  public function toDTO(contact : Contact) : AccountContactDTO
  public function updateContact(contact : Contact, dto : AccountContactDTO)

}
