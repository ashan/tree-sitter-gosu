package nz.co.acc.edge.capabilities.policy.lob.cpx.dto

uses edge.capabilities.policy.dto.CoverageDTO
uses edge.capabilities.policy.lob.dto.IPolicyLobExtensionDTO
uses edge.capabilities.policy.lob.dto.PolicyLineBaseDTO
uses edge.jsonmapper.JsonProperty
uses nz.co.acc.edge.capabilities.policy.dto.BICCodeDTO_ACC
uses nz.co.acc.edge.capabilities.policy.dto.CoverableDTO_ACC
uses nz.co.acc.edge.capabilities.policy.lob.dto.PolicyLineBaseDTO_ACC

uses java.math.BigDecimal

/**
 * Created by nitesh.gautam on 30-Mar-17.
 */
class CPXPolicyExtensionDTO_ACC extends PolicyLineBaseDTO_ACC implements IPolicyLobExtensionDTO {
  @JsonProperty
  var _coverageDTOs : CoverageDTO[] as CoverageDTOs

  @JsonProperty
  var _coverableDTOs : CoverableDTO_ACC[] as CoverableDTOs

  @JsonProperty
  var _BICCodes : BICCodeDTO_ACC[] as BICCodes

  @JsonProperty
  var _maximumCoverPermitted : BigDecimal as MaximumCoverPermitted

  @JsonProperty
  var _minimumCoverPermitted : BigDecimal as MinimumCoverPermitted

  @JsonProperty
  var _legislativeMaximumCover : BigDecimal as LegislativeMaximumCover

  @JsonProperty
  var _employmentStatus : String as EmploymentStatus

  @JsonProperty
  var _businessStructure : String as BusinessStructure
}