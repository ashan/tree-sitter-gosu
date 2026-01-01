package edge.capabilities.quote.lob.personalauto.draft

uses gw.api.productmodel.QuestionSet
uses edge.security.authorization.IAuthorizerProviderPlugin
uses edge.di.annotations.InjectableNode
uses edge.capabilities.quote.questionset.util.QuestionSetUtil

class PaAgentDraftPlugin extends PaDraftPlugin {

  @InjectableNode
  construct(authzProvider:IAuthorizerProviderPlugin) {
    super(authzProvider)
  }

  override protected function getPolicyQuestionSets(period : PolicyPeriod) : QuestionSet[] {
    return {QuestionSetUtil.getByCode("PAPersonalAutoPreQual")}
  }
}
