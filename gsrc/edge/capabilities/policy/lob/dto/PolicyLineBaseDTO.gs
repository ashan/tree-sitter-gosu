package edge.capabilities.policy.lob.dto

uses edge.jsonmapper.JsonProperty
uses edge.capabilities.currency.dto.AmountDTO

uses java.math.BigDecimal
uses java.util.Date
uses edge.aspects.validation.annotations.Required
uses nz.co.acc.edge.capabilities.policy.dto.BICCodeDTO_ACC

/** 
 * Base DTO for all the policy lines. Each policy line should
 * add it's own properties to it.
 */
class PolicyLineBaseDTO {
  @JsonProperty
  var _publicID : String as PublicID

  @JsonProperty
  var _policyNumber : String as PolicyNumber
  
  @JsonProperty
  var _lineOfBusiness : String as LineOfBusiness

  @JsonProperty
  var _expirationDate : Date as ExpirationDate
  
  @JsonProperty
  var _effectiveDate : Date as EffectiveDate

  @JsonProperty
  var _status : String as Status
    
  @JsonProperty
  var _totalPremium : AmountDTO as TotalPremium

  @JsonProperty
  var _levyCost : BigDecimal as LevyCost

  @JsonProperty
  var _levyCostDifference : BigDecimal as LevyCostDifference

  @JsonProperty
  var _bICCodes : BICCodeDTO_ACC[] as BICCodes

  construct() {

  }

}
