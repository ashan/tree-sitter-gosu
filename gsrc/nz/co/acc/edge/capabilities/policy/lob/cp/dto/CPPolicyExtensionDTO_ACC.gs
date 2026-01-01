package nz.co.acc.edge.capabilities.policy.lob.cp.dto

uses edge.capabilities.policy.dto.CoverageDTO
uses edge.capabilities.policy.lob.dto.IPolicyLobExtensionDTO
uses edge.jsonmapper.JsonProperty
uses nz.co.acc.edge.capabilities.policy.dto.BICCodeDTO_ACC
uses nz.co.acc.edge.capabilities.policy.dto.CoverableDTO_ACC
uses nz.co.acc.edge.capabilities.policy.lob.dto.PolicyLineBaseDTO_ACC

uses java.math.BigDecimal

/**
 * Created by nitesh.gautam on 27-Mar-17.
 */
class CPPolicyExtensionDTO_ACC extends PolicyLineBaseDTO_ACC implements IPolicyLobExtensionDTO {
  @JsonProperty
  var _coverageDTOs : CoverageDTO[] as CoverageDTOs

  @JsonProperty
  var _coverableDTOs : CoverableDTO_ACC[] as CoverableDTOs

  @JsonProperty
  var _BICCodes : BICCodeDTO_ACC[] as BICCodes

  @JsonProperty
  var _LiableEarnings : BigDecimal as LiableEarnings

  @JsonProperty
  var _cpLiableEarnings : CPLiableEarningsDTO_ACC as CoverPlusEarnings

  @JsonProperty
  var _historicalEarningACCs : HistoricalEarnings_ACC[] as HistoricalEarnings
}