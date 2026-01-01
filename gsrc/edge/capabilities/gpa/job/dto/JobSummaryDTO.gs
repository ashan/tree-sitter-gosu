package edge.capabilities.gpa.job.dto

uses edge.capabilities.gpa.product.dto.ProductDTO
uses edge.jsonmapper.JsonProperty
uses java.util.Date
uses edge.capabilities.gpa.policy.dto.PolicyLineDTO
uses edge.capabilities.gpa.currency.dto.CurrencyDTO

/**
 * Minimal DTO for basic Job information
 */
class JobSummaryDTO {

  @JsonProperty
  var _publicID : String as PublicID

  @JsonProperty
  var _jobNumber : String as JobNumber

  @JsonProperty
  var _createTime : Date as CreateTime

  @JsonProperty
  var _closeDate : Date as CloseDate

  @JsonProperty
  var _accountNumber : String as AccountNumber

  @JsonProperty
  var _accountHolderName : String as AccountHolderName

  @JsonProperty
  var _policyNumber : String as PolicyNumber

  @JsonProperty
  var _policyIssued : Boolean as PolicyIssued

  @JsonProperty
  var _policyLines : PolicyLineDTO[] as PolicyLines

  @JsonProperty
  var _policyEffectiveDate : Date as PolicyEffectiveDate

  @JsonProperty
  var _policyDisplayStatus : String as PolicyDisplayStatus

  @JsonProperty
  var _producerCodeOfRecord: String as ProducerCodeOfRecord

  @JsonProperty
  var _producerCodeOfService: String as ProducerCodeOfService

  @JsonProperty
  var _status : String as Status

  @JsonProperty
  var _description : String as Description

  @JsonProperty
  var _type : typekey.Job as Type

  @JsonProperty
  var _displayType : String as DisplayType

  @JsonProperty
  var _canUserView : Boolean as CanUserView

  @JsonProperty
  var _createdByMe : Boolean as CreatedByMe

  @JsonProperty
  var _totalPremium : CurrencyDTO as TotalPremium

  @JsonProperty
  var _product : ProductDTO as Product
}
