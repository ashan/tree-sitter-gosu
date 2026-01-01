package edge.capabilities.policychange.dto

uses edge.jsonmapper.JsonProperty
uses java.lang.Integer

/** A read-only DTO encapsulating summary information about a policy. */
class PolicySummaryDTO {

  /** The policy number */
  @JsonProperty
  var _policyNumber : String as PolicyNumber

  /** The policy effective date */
  @JsonProperty
  var _effectiveDate : String as EffectiveDate

  /** The policy expiration date */
  @JsonProperty
  var _expirationDate : String as ExpirationDate

  /**The policy product name */
  @JsonProperty
  var _productName: String as ProductName

  /** Used to determine whether or not to fill in LOB specific information */
  @JsonProperty
  var _personalAutoLineExists : boolean as PersonalAutoLineExists

  /** The policy product code */
  @JsonProperty
  var _productCode: String as ProductCode

  /** A description to allow the identification of the policy by the user.
   *  For PersonalAuto policies, it display the first two vehicles in the policy */
  @JsonProperty
  var _overview: String as Overview

  /** Similar to Overview, but intended to be used in mobile devices. */
  @JsonProperty
  var _shortOverview: String as ShortOverview

  /** A flag signaling if a policy change can be started for this policy.
   Policy changes can't be started for policies with more than one draft policy change,
   with bound cancellations or with PolicyRewrites jobs in the future. */
  @JsonProperty
  var _disabled: boolean as Disabled

  /** The number of vehicles on the policy */
  @JsonProperty
  var _quantity: Integer as Quantity

}
