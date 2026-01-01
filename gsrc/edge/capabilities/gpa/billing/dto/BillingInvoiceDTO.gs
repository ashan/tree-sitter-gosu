package edge.capabilities.gpa.billing.dto

uses edge.jsonmapper.JsonProperty
uses java.util.Date
uses edge.aspects.validation.annotations.Size
uses edge.capabilities.gpa.currency.dto.CurrencyDTO

class BillingInvoiceDTO {

  @JsonProperty  @Size(0, 255)
  var _invoiceNumber : String as InvoiceNumber

  @JsonProperty
  var _invoiceDate : Date as InvoiceDate

  @JsonProperty
  var _dueDate : Date as DueDate

  @JsonProperty
  var _amount : CurrencyDTO as Amount

  @JsonProperty
  var _unpaid : CurrencyDTO as Unpaid

  @JsonProperty
  var _paid : CurrencyDTO as Paid

  @JsonProperty  @Size(0, 255)
  var _status : String as Status

  @JsonProperty  @Size(0, 255)
  var _paidStatus : String as PaidStatus

}
