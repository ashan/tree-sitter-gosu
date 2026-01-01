package edge.capabilities.quote.questionset.dto

uses java.lang.Integer
uses edge.jsonmapper.JsonProperty

/**
 * QuestionDTO contains Question data needed by the web portal.  
 * 
 * Boolean questions are modeled as having two choices - true and false
 * The text of the questions is derived from the locale - this allows the text used in the consumer-facing web portal to be
 * different from that shown to the underwriter/agent in PolicyCenter
 */
class QuestionDTO {

  @JsonProperty    
  var _code : String as Code

  @JsonProperty // ReadOnly
  var _text : String as DisplayKey

  @JsonProperty // ReadOnly
  var _required : boolean as Required

  @JsonProperty // ReadOnly
  var _questionType : typekey.QuestionType as QuestionType

  @JsonProperty // ReadOnly
  var _choices : QuestionChoiceDTO[] as Choices

  @JsonProperty // ReadOnly
  var _filters : QuestionFilterDTO[] as Filters
  
  @JsonProperty // ReadOnly
  var _order : Integer as Order
}
