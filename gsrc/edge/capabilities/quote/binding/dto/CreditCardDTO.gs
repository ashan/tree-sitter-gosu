package edge.capabilities.quote.binding.dto

uses edge.jsonmapper.JsonProperty
uses java.util.Date
uses edge.aspects.validation.annotations.Required
uses edge.aspects.validation.annotations.FutureDate
uses edge.aspects.validation.annotations.CreditCardNumber

/*
  The information in the credit card DTO is covered by PCI-DSS.
  It is the customers responsibility to handle and apply any security / data protection required to this data as the portal is only a conduit to their implementation.
*/
class CreditCardDTO {
  
  @JsonProperty @Required @FutureDate
  var _creditCardExpDate : Date as CreditCardExpDate
  
  @JsonProperty @Required
  var _creditCardIssuer : typekey.CreditCardIssuer as CreditCardIssuer
  
  @JsonProperty @Required @CreditCardNumber
  var _creditCardNumber : String as CreditCardNumber
  
  construct(){} //The sending of payments is a unidirectional operation - the frontend is responsible for creation and PC receives them.

}
