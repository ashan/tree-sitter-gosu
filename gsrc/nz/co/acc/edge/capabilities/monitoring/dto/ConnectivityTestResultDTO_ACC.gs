package nz.co.acc.edge.capabilities.monitoring.dto

uses edge.jsonmapper.JsonProperty

/**
 * Created by Mike Ourednik on 27/03/20.
 */
class ConnectivityTestResultDTO_ACC {

  @JsonProperty
  var _successful : Boolean as Successful

  @JsonProperty
  var _response : String as Response

  @JsonProperty
  var _error : String as Error
}