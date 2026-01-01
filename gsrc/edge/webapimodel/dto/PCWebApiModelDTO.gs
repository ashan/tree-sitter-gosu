package edge.webapimodel.dto

uses edge.jsonmapper.JsonProperty
uses java.util.HashMap
uses gw.api.productmodel.QuestionSet
uses gw.lang.reflect.IType
uses edge.capabilities.quote.questionset.dto.QuestionSetDTO
uses edge.capabilities.quote.questionset.util.QuestionSetUtil

class PCWebApiModelDTO extends WebApiModelDTO {

  @JsonProperty
  private var _questionSets:HashMap<String, QuestionSetDTO> as readonly questionSets

  construct() {
    _questionSets = new HashMap<String, QuestionSetDTO>()
  }
  
  function registerQuestionSet(qs:QuestionSet):WebApiModelDTO {
    _questionSets.put(qs.CodeIdentifier, QuestionSetUtil.toDTO(qs, null));
    return this
  }
  
  public static function forTypes(types: IType[], questionSets: QuestionSet[]): Object {
    var model = new PCWebApiModelDTO()

    questionSets.each( \ qs -> model.registerQuestionSet(qs))
    types.each(\ t -> model.registerType(t))
    return model
  }
}
