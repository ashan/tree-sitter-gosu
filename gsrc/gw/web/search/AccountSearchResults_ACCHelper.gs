package gw.web.search

uses gw.account.AccountSearchCriteria

class AccountSearchResults_ACCHelper {

  function getPrimaryAccAccountNumber(account : Account) : String {
    var contact : Contact = account.getAccountHolderContact()
    var company : Company = contact.ContactCompany
    if (company != null and company.PrimaryACCNumber_ACC != null) {
      return company.PrimaryACCNumber_ACC.toString()
    }
    // default value
    return null
  }

  function getPhone(account : Account, searchCriteria : AccountSearchCriteria) : String {
    var contact : Contact = account.getAccountHolderContact()
    if (searchCriteria.Phone.NotBlank) {
      return searchCriteria.Phone
    } else {
      if (contact.PrimaryPhone != null) {
        if (contact.PrimaryPhone == PrimaryPhoneType.TC_MOBILE) {
          if (contact typeis Person) {
            return contact.CellPhone
          } else {
            return (contact as Company).CellPhone_ACC
          }
        } else if (contact.PrimaryPhone == PrimaryPhoneType.TC_HOME) {
          return contact.HomePhone
        } else {
          return contact.WorkPhone
        }
      } else {
        if (contact typeis Person and contact.CellPhone.NotBlank) return contact.CellPhone
        else if (contact typeis Company and contact.CellPhone_ACC.NotBlank) return contact.CellPhone_ACC
        else if (contact.HomePhone.NotBlank) return contact.HomePhone
        else if (contact.WorkPhone.NotBlank) return contact.WorkPhone
        else return contact.IRCellPhone_ACC
      }
    }
  }

  function getEmail(account : Account, searchCriteria : AccountSearchCriteria) : String {
    var contact : Contact = account.getAccountHolderContact()
    if(searchCriteria.Email.NotBlank){
      return searchCriteria.Email
    }else{
      if (contact.EmailAddress1.NotBlank){
        return contact.EmailAddress1
      }
      else if(contact.EmailAddress2.NotBlank){
        return contact.EmailAddress2
      }
      else{
        return contact.IREmailAddress
      }
    }
  }
}


