package edge.capabilities.policychange.dto

uses edge.jsonmapper.JsonProperty
uses edge.aspects.validation.annotations.Required

/*
  The information in the bank details DTO is covered by PCI-DSS.
 It is the customers responsibility to handle and apply any security / data protection required to this data as the portal is only a conduit to their implementation.
*/

class BankDetailsDTO {
    
  @JsonProperty @Required
  var _bankABANumber : String as BankABANumber
  
  @JsonProperty @Required
  var _bankAccountNumber : String as BankAccountNumber
  
  @JsonProperty
  var _bankAccountType : typekey.BankAccountType as BankAccountType  
  
  @JsonProperty @Required
  var _bankName : String as BankName
  
  construct(){} //The sending of payments is a unidirectional operation - the frontend is responsible for creation and PC receives them.
  
}
