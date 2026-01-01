package edge.capabilities.gpa.contact

uses edge.capabilities.gpa.contact.dto.CompanyDTO
uses edge.capabilities.gpa.contact.dto.PersonDTO

interface IContactPlugin {

  public function toDTO(aPerson : Person) : PersonDTO
  public function toDTO(aCompany : Company) : CompanyDTO
  public function updateContact(aPerson : Person, dto : PersonDTO)
  public function updateContact(aCompany : Company, dto : CompanyDTO)

}
