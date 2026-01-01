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
class CPPolicyUpdateDTO_ACC extends PolicyLineBaseDTO_ACC {
  @JsonProperty
  var _liableEarnings : CPLiableEarningsDTO_ACC as LiableEarnings


}