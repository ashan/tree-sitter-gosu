package edge.capabilities.policychange.dto

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

  /** Credit card expiry date. */
  @JsonProperty @Required @FutureDate
  var _creditCardExpDate : Date as CreditCardExpDate

  /** The issuer of the credit card. OOB this can be one of the following:
  * <ul>
  *   <li>amex</li>
  *   <li>dinersclub</li>
  *   <li>discover</li>
  *   <li>mastercard</li>
  *   <li>visa</li>
  * </ul>
   */
  @JsonProperty @Required
  var _creditCardIssuer : typekey.CreditCardIssuer as CreditCardIssuer
  
  @JsonProperty @Required @CreditCardNumber
  var _creditCardNumber : String as CreditCardNumber
  
  construct(){} //The sending of payments is a unidirectional operation - the frontend is responsible for creation and PC receives them.

}
