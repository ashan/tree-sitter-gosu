package edge.capabilities.quote.binding.dto

uses edge.jsonmapper.JsonProperty
uses edge.aspects.validation.annotations.Required
uses edge.el.Expr
uses edge.aspects.validation.Validation

/*
The information in the payment details DTO is covered by PCI-DSS.
It is the customers responsibility to handle and apply any security / data protection required to this data as the portal is only a conduit to their implementation.
*/
class PaymentDetailsDTO {
  
  @JsonProperty @Required
  var _paymentMethod : String as PaymentMethod
  
  @JsonProperty @Required(Expr.eq(Expr.getProperty("PaymentMethod", Validation.PARENT), 'wire'))
  var _bankAccountData : BankDetailsDTO as BankAccountData
  
  @JsonProperty @Required(Expr.eq(Expr.getProperty("BankAccountData", Validation.PARENT), 'creditcard'))
  var _creditCardData : CreditCardDTO as CreditCardData
  
  construct() {} //The sending of payments is a unidirectional operation - the frontend is responsible for creation and PC receives them.

}
