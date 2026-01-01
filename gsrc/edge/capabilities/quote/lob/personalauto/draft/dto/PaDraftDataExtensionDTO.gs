package edge.capabilities.quote.lob.personalauto.draft.dto

uses edge.jsonmapper.JsonProperty
uses edge.capabilities.quote.questionset.dto.QuestionSetAnswersDTO
uses edge.capabilities.quote.lob.dto.IDraftLobExtensionDTO

class PaDraftDataExtensionDTO implements IDraftLobExtensionDTO {
  @JsonProperty
  var _preQualQuestionSets : QuestionSetAnswersDTO[] as PreQualQuestionSets

  @JsonProperty  
  var _drivers : DriverDTO[] as Drivers

  @JsonProperty  
  var _vehicles : VehicleDTO[] as Vehicles
}
