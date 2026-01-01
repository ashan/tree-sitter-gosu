package nz.co.acc.edge.capabilities.gpa.policy.dto

uses edge.capabilities.gpa.policy.dto.PolicySummaryDTO
uses edge.jsonmapper.JsonProperty

uses java.math.BigDecimal

/**
 * Created by nitesh.gautam on 6/03/2017.
 */
class PolicySummaryDTO_ACC extends PolicySummaryDTO {
  @JsonProperty
  var _taxesAndFees: BigDecimal as TaxesAndFees

  @JsonProperty
  var _ACCPolicySuffix: String as ACCPolicySuffix

  @JsonProperty
  var _memberACCID_ACC : String as MemberACCID_ACC

  @JsonProperty
  var _aepPrimeAccountACCID_ACC : String as AEPPrimeAccountACCID_ACC
}