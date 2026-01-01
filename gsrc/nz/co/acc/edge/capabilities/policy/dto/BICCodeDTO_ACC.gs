package nz.co.acc.edge.capabilities.policy.dto

uses edge.aspects.validation.annotations.Required
uses edge.aspects.validation.annotations.Size
uses edge.jsonmapper.JsonProperty

/**
 * Created by nitesh.gautam on 04-Apr-17.
 */
class BICCodeDTO_ACC {
  @JsonProperty
  var _CUCode : String as CUCode

  @JsonProperty @Size(4, 450)
  var _CUDescription : String as CUDescription

  @JsonProperty
  var _businessIndustryCode : String as BicCode

  @JsonProperty
  var _changeReason : String as ChangeReason

  @JsonProperty
  var _availableYears: Integer[] as AvailableYears
}