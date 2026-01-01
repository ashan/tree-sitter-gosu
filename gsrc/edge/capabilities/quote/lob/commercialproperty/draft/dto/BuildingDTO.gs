package edge.capabilities.quote.lob.commercialproperty.draft.dto

uses edge.capabilities.address.dto.AddressDTO
uses edge.jsonmapper.JsonProperty
uses edge.aspects.validation.annotations.Required
uses java.lang.Integer

/**
 * Information about one insured dwelling.
 */
class BuildingDTO {

  @JsonProperty
  var _name : String as Name

  @JsonProperty @Required
  var _classCode : String as ClassCode

  @JsonProperty @Required
  var _coverageForm : CoverageForm as CoverageForm

  @JsonProperty @Required
  var _rateType : RateType as RateType

  @JsonProperty
  var _description : String as Description

  @JsonProperty
  var _year : Integer as YearBuilt

  @JsonProperty
  var _number : Integer as BuildingNumber

  @JsonProperty
  var _constructionType : ConstructionType as ConstructionType

  @JsonProperty
  var _locationId : String as locationId

  @JsonProperty
  var _addressDisplayName : String as AddressDisplayName

  @JsonProperty
  var _exposure : String as Exposure

  @JsonProperty
  var _numberOfStories : Integer as NumberOfStories

  @JsonProperty
  var _totalAreaExcludingBasement : Integer as TotalAreaExcludingBasement

  @JsonProperty
  var _percentageSprinklered : typekey.Sprinklered  as PercentageSprinklered

  @JsonProperty
  var _alarmType : typekey.BuildingAlarmType as AlarmType

  @JsonProperty
  var _publicID : String as PublicID

}
