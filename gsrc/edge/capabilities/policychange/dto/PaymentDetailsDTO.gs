package edge.capabilities.policychange.dto

uses edge.jsonmapper.JsonProperty
uses edge.aspects.validation.annotations.Required

/*
The information in the payment details DTO is covered by PCI-DSS.
It is the customers responsibility to handle and apply any security / data protection required to this data as the portal is only a conduit to their implementation.
*/

class PaymentDetailsDTO {

  /** Describes whether or not bank details or credit card info is used. */
  @JsonProperty @Required
  var _paymentMethod : String as PaymentMethod
  
  @JsonProperty
  var _bankAccountData : BankDetailsDTO as BankAccountData
  
  @JsonProperty
  var _creditCardData : CreditCardDTO as CreditCardData
  
  construct() {} //The sending of payments is a unidirectional operation - the frontend is responsible for creation and PC receives them.

}
