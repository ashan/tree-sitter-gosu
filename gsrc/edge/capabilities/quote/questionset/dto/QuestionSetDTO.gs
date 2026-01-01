package edge.capabilities.quote.questionset.dto

uses java.lang.String
uses edge.capabilities.quote.questionset.dto.QuestionDTO
uses edge.jsonmapper.JsonProperty

class QuestionSetDTO {
  @JsonProperty
  var _code : String as Code

  @JsonProperty
  var _text : String as DisplayKey

  @JsonProperty
  var _orderedQuestions : QuestionDTO[] as OrderedQuestions
}
