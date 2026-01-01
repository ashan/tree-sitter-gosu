package nz.co.acc.edge.capabilities.policy.dto

uses edge.jsonmapper.JsonProperty

uses java.math.BigDecimal

/**
 * Created by nitesh.gautam on 27-Mar-17.
 */
class CoverableDTO_ACC {
  @JsonProperty
  var _publicID: String as PublicID

  @JsonProperty
  var _fixedID: Long as FixedID

  @JsonProperty
  var _employeeStatus : String as EmployeeStatus

  @JsonProperty
  var _RequestedLevelOfCover : BigDecimal as RequestedLevelOfCover

  @JsonProperty
  var _AgreedLevelOfCover : BigDecimal as AgreedLevelOfCover

  @JsonProperty
  var _PeriodStart : Date as PeriodStart

  @JsonProperty
  var _PeriodEnd : Date as PeriodEnd

  @JsonProperty
  var _ApplicationReceived : Date as ApplicationReceived

  @JsonProperty
  var _CoverType : String as CoverType

  @JsonProperty
  var _MaxCoverPermitted : BigDecimal as MaxCoverPermitted

  var _exists : boolean as Exists

  construct() {

  }
}