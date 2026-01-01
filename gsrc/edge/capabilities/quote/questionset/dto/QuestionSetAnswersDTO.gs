package edge.capabilities.quote.questionset.dto

uses edge.jsonmapper.JsonProperty
uses java.util.HashMap

class QuestionSetAnswersDTO {

  @JsonProperty
  var _code : String as Code

  @JsonProperty
  var _answers: HashMap<String, String> as Answers

}
