package nz.co.acc.edge.capabilities.policy.lob.dto

uses edge.capabilities.policy.lob.dto.PolicyLineBaseDTO
uses edge.jsonmapper.JsonProperty
uses nz.co.acc.edge.capabilities.policy.dto.CoverableDTO_ACC
uses nz.co.acc.edge.capabilities.policy.lob.cp.CPEarnings_ACC
uses nz.co.acc.edge.capabilities.policy.lob.cp.dto.CPLiableEarningsDTO_ACC
uses nz.co.acc.edge.capabilities.policy.lob.wpc.dto.WPCEarnings_ACC

/**
 * Created by nitesh.gautam on 07-Jun-17.
 */
class PolicyLineBaseDTO_ACC extends PolicyLineBaseDTO {
  @JsonProperty
  var _ACCPolicySuffix: String as ACCPolicySuffix

  @JsonProperty
  var _coverableDTOs : CoverableDTO_ACC[] as CoverableDTOs

  @JsonProperty
  var _employmentStatus : String as EmploymentStatus

  @JsonProperty
  var _businessStructure : String as BusinessStructure

  @JsonProperty
  var _employerEarnings : WPCEarnings_ACC as EmployerEarnings

  @JsonProperty
  var _coverPlusEarnings : CPLiableEarningsDTO_ACC as CoverPlusEarnings
}