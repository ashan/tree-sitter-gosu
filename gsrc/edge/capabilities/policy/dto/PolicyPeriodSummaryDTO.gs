package edge.capabilities.policy.dto
uses typekey.PolicyLine
uses java.lang.String
uses edge.jsonmapper.JsonProperty
uses java.util.Date
uses edge.capabilities.currency.dto.AmountDTO

/**
 * Summary for one policy line. Policy can have several policy lines.
 * That lines ususally denotes either historical periods or futere renewals
 * for the policy.
 */
class PolicyPeriodSummaryDTO {
  /**
   * Policy lines for this policy 
   */
  @JsonProperty  
  var _lines : typekey.PolicyLine[] as Lines
  
  /**
   * Policy identifier.
   */
  @JsonProperty
  var _policyId : String as PolicyId
  
  /**
   * Date when this policy became effective.
   */
  @JsonProperty
  var _effective : Date   as Effective
  
  /**
   * Active expiration date for active policy period.
   */
  @JsonProperty
  var _expiration : Date as Expiration
  
  /**
   * Policy premium.
   */
  @JsonProperty
  var _premium : AmountDTO as Premium
  
  /**
   * Policy overview. Can be multiline.
   */
  @JsonProperty
  var _overview : String as Overview
  
  @JsonProperty
  var _idCardPublicID : String as IdCardPublicID
  
  @JsonProperty
  var _idCardSessionID : String as IdCardSessionID


}
