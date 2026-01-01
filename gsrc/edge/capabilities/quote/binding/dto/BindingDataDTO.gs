package edge.capabilities.quote.binding.dto

uses edge.jsonmapper.JsonProperty
uses edge.capabilities.address.dto.AddressDTO
uses edge.aspects.validation.annotations.Required
uses edge.el.Expr
uses edge.aspects.validation.Validation
uses edge.aspects.validation.annotations.Phone
uses edge.aspects.validation.annotations.Augment
uses edge.aspects.validation.annotations.Email

class BindingDataDTO {
  
  @JsonProperty
  var _accountNumber : String as AccountNumber

  @JsonProperty  
  var _chosenQuote : String as ChosenQuote //the public ID for the chosen quote

  @JsonProperty
  var _paymentPlans : PaymentPlanDTO[] as PaymentPlans

  @JsonProperty
  var _selectedPaymentPlan : String as SelectedPaymentPlan
  
  /**
   * Policy period for the bound policy.
   */
  @JsonProperty
  var _resultingPolicyPeriod : String as PolicyNumber

  @JsonProperty @Required(Expr.neq(Expr.getProperty("ChosenQuote", Validation.PARENT),null)) @Phone
  var _contactPhone : String as ContactPhone

  @JsonProperty @Email
  @Required(Expr.all({Expr.neq(Expr.getProperty("ChosenQuote", Validation.PARENT),null) ,
      Expr.eq(Validation.getContext("DriverEmailRequired"), true)}))
  var _contactEmail : String as ContactEmail

  @JsonProperty
  @Augment({"AddressLine1"}, {new Required()})
  var _billingAddress : AddressDTO as BillingAddress

  /*
    Included here for static DTO schema generation. Ideally we would pass this back to the payment service.
    The information in the payment details DTO is covered by PCI-DSS.
    It is the customers responsibility to handle and apply any security / data protection required to this data as the portal is only a conduit to their implementation.
   */
  @JsonProperty
  var _paymentDetails : PaymentDetailsDTO as PaymentDetails
}
