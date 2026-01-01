package edge.capabilities.gpa.billing.dto

uses edge.jsonmapper.JsonProperty
uses edge.aspects.validation.annotations.Size
uses edge.capabilities.gpa.currency.dto.CurrencyDTO
uses java.util.Date

class PolicyPeriodBillingSummaryDTO {

  @JsonProperty  @Size(0, 255)
  var _policyNumber : String as PolicyNumber

  @JsonProperty  @Size(0, 255)
  var _productName : String as ProductName

  @JsonProperty
  var _billedAmount : CurrencyDTO as BilledAmount

  @JsonProperty
  var _pastDueAmount : CurrencyDTO as PastDueAmount

  @JsonProperty
  var _unbilledAmount : CurrencyDTO as UnbilledAmount

  @JsonProperty  @Size(0, 255)
  var _alternativeBillingAccount : String as AlternativeBillingAccount

  @JsonProperty  @Size(0, 255)
  var _owningAccount : String as OwningAccount

  @JsonProperty
  var _isDelinquent : boolean as IsDelinquent

  @JsonProperty
  var _currentOutstandingAmount : CurrencyDTO as CurrentOutstandingAmount

  @JsonProperty
  var _paidAmount : CurrencyDTO as PaidAmount

  @JsonProperty
  var _totalCharges : CurrencyDTO as TotalCharges

  @JsonProperty
  var _billingMethod : BillingMethod as BillingMethod

  @JsonProperty
  var _paymentPlan : String as PaymentPlan

  @JsonProperty
  var _invoiceStream : String as InvoiceStream

  @JsonProperty
  var _invoices : BillingInvoiceDTO[] as Invoices

  @JsonProperty
  var _periodName : String as PeriodName

  @JsonProperty
  var _effectiveDate : Date as EffectiveDate

  @JsonProperty
  var _expirationDate : Date as ExpirationDate

  @JsonProperty
  var _canUserView : Boolean as CanUserView
}
