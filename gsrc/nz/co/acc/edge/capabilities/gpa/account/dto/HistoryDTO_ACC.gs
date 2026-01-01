package nz.co.acc.edge.capabilities.gpa.account.dto

uses edge.aspects.validation.annotations.Size
uses edge.jsonmapper.JsonProperty

/**
 * Created by Stephen.Zhang on 22/06/2017.
 */
class HistoryDTO_ACC {

  @JsonProperty
  var _creator: String as Creator

  @JsonProperty
  var _date: Date as Date

  @JsonProperty
  var _type: String as Type

  @JsonProperty
  @Size(0, 255)
  var _description: String as Description

  @JsonProperty
  @Size(0, 255)
  var _policyNumber: String as PolicyNumber
}