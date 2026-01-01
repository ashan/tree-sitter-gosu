package edge.capabilities.quote.binding.dto

uses edge.jsonmapper.JsonProperty
uses edge.capabilities.currency.dto.AmountDTO

/**
 * PaymentPlanDTO contains PaymentPlan details used by the portal. The plans are retrieved BillingCenter.  
 */
class PaymentPlanDTO {

  @JsonProperty
  var _name : String as Name
  
  @JsonProperty
  var _downPayment : AmountDTO as DownPayment
  
  @JsonProperty
  var _total : AmountDTO as Total
  
  @JsonProperty
  var _installment : AmountDTO as Installment
  
  @JsonProperty
  var _billingId : String as BillingId
  
}
