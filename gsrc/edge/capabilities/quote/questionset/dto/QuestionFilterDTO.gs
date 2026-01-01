package edge.capabilities.quote.questionset.dto

uses edge.jsonmapper.JsonProperty
/**
 * Filter condition for the question. Contains related question and answer required for this question.
 */
class QuestionFilterDTO {
  /**
   * Question code for the related question.
   */
  @JsonProperty
  var _questionCode : String as QuestionCode

  /**
   * Answer code on the source question.
   */
  @JsonProperty
  var _answer : String as Answer
}
