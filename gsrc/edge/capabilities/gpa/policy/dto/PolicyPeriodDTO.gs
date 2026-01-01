package edge.capabilities.gpa.policy.dto

uses edge.jsonmapper.JsonProperty
uses java.util.Date
uses edge.capabilities.gpa.currency.dto.CurrencyDTO

class PolicyPeriodDTO {

  @JsonProperty
  var _publicID : String as PublicID

  @JsonProperty
  var _policyNumber: String as PolicyNumber

  @JsonProperty
  var _policyLinesDTOs: PolicyLineDTO[] as PolicyLines

  @JsonProperty
  var _effectiveDate: Date as EffectiveDate

  @JsonProperty
  var _status: String as Status

  @JsonProperty
  var _displayStatus: String as DisplayStatus

  @JsonProperty
  var _totalPremium: CurrencyDTO as TotalPremium

  @JsonProperty
  var _expirationDate: Date as ExpirationDate

  @JsonProperty
  var _producerCodeOfRecord: String as ProducerCodeOfRecord

  @JsonProperty
  var _producerCodeOfService: String as ProducerCodeOfService

  @JsonProperty
  var _canRenew: boolean as canRenew

  @JsonProperty
  var _canCancel: boolean as canCancel

  @JsonProperty
  var _canChange: boolean as canChange

  @JsonProperty
  var _totalCost: CurrencyDTO as TotalCost

  @JsonProperty
  var _taxesAndFees: CurrencyDTO as TaxesAndFees

  @JsonProperty
  var _producerCodeOfRecordOrg: String as ProducerCodeOfRecordOrg

  @JsonProperty
  var _producerCodeOfServiceOrg: String as ProducerCodeOfServiceOrg

  @JsonProperty
  var _createdByMe : boolean as CreatedByMe

  @JsonProperty
  var _primaryInsuredName : String as PrimaryInsuredName

  @JsonProperty
  var _canceled : boolean as Canceled
}
