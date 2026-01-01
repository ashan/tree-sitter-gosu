package edge.capabilities.quote.questionset.dto

uses edge.jsonmapper.JsonProperty
uses gw.api.productmodel.QuestionChoice
uses gw.api.productmodel.QuestionSet
uses gw.api.productmodel.Question

class QuestionChoiceDTO {
  @JsonProperty
  var _choiceCode : String as ChoiceCode
  
  @JsonProperty
  var _text : String as DisplayKey

  construct() {
  }
}
