package nz.co.acc.edge.capabilities.policy.dto

uses edge.aspects.validation.annotations.Required
uses edge.capabilities.currency.dto.AmountDTO
uses edge.capabilities.policy.dto.PolicyPeriodDTO
uses edge.jsonmapper.JsonProperty
uses nz.co.acc.edge.capabilities.policy.lob.cp.dto.HistoricalEarnings_ACC

uses java.math.BigDecimal

/**
 * Created by lee.teoh on 22/06/2017.
 */
class PolicyPeriodDTO_ACC extends PolicyPeriodDTO {
  @JsonProperty
  var _ceasedTradingDate : Date as CeasedTradingDate

  @JsonProperty
  var _hasPendingPolicyChange : boolean as HasPendingPolicyChange

  @JsonProperty
  var _hasPendingRenewing : boolean as HasPendingRenewing

  @JsonProperty
  var _levyCost : BigDecimal as LevyCost

  @JsonProperty
  var _levyCostDifference : BigDecimal as LevyCostDifference

  @JsonProperty @Required
  var _jobType : String as JobType

  @JsonProperty @Required
  var _status : String as Status

  @JsonProperty @Required
  var _policyNumber : String as PolicyNumber

  @JsonProperty @Required
  var _policyStatus : String as PolicyStatus

  @JsonProperty @Required
  var _totalPremium : AmountDTO as TotalPremium

  @JsonProperty
  var _jobNumber : String as JobNumber

  @JsonProperty
  var _triggerReason : String as TriggerReason

  @JsonProperty
  var _cpxMaximumCoverPermitted : BigDecimal as CPXMaximumCoverPermitted

  @JsonProperty
  var _cpxMinimumCoverPermitted : BigDecimal as CPXMinimumCoverPermitted

  @JsonProperty
  var _aepPrimeAccountACCID_ACC : String as AEPPrimeAccountACCID_ACC

  @JsonProperty
  var _activeTerm : Boolean as ActiveTerm

  @JsonProperty
  var _shareholderEarnings : HistoricalEarnings_ACC[] as ShareholderEarnings

  var _branch : PolicyPeriod as Branch
}