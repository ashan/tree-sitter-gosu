package nz.co.acc.edge.capabilities.gpa.account.dto

uses edge.aspects.validation.annotations.Required
uses edge.aspects.validation.annotations.Size
uses edge.capabilities.gpa.account.dto.AccountDTO
uses edge.jsonmapper.JsonProperty

/**
 * Created by nitesh.gautam on 1/03/2017.
 */
class ActivityDTO_ACC {
  @JsonProperty
  var _activityID : String as ActivityID

  @JsonProperty  @Size(0, 1333)
  var _description : String as Description

  @JsonProperty  @Size(1, 255) @Required
  var _subject : String as Subject

}