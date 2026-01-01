package nz.co.acc.edge.capabilities.accountcontact

uses edge.capabilities.policycommon.accountcontact.IAccountContactPlugin
uses entity.AccountContact
uses entity.Contact
uses nz.co.acc.edge.capabilities.accountcontact.dto.AccountContactDTO_ACC
uses nz.co.acc.edge.capabilities.accountcontact.dto.CompanyContactRelationshipDTO_ACC
uses nz.co.acc.edge.capabilities.accountcontact.dto.PersonContactRelationshipDTO_ACC

interface IAccountContactPlugin_ACC extends IAccountContactPlugin {
  public function updateContact(contact : AccountContact, dto : AccountContactDTO_ACC, reason : String) : AccountContactDTO_ACC

  public function toAccountContactDTO_ACC(contact : AccountContact) : AccountContactDTO_ACC

  public function createCompanyContactRelationship(account : Account, contactRelationshipDTO : CompanyContactRelationshipDTO_ACC) : String

  public function deleteCompanyContactRelationship(account : Account, contactRelationshipDTO : CompanyContactRelationshipDTO_ACC) : String

  public function createPersonContactRelationship(account : Account, contactRelationshipDTO : PersonContactRelationshipDTO_ACC) : String

  public function deletePersonContactRelationship(account : Account, contactRelationshipDTO : PersonContactRelationshipDTO_ACC) : String

}