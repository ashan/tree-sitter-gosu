package edge.capabilities.locale.local

uses edge.di.annotations.ForAllGwNodes
uses edge.capabilities.quote.questionset.util.QuestionSetUtil

/**
 * Default implementation of question translator plugin.
 */
class DefaultQuestionTranslatorPlugin implements IQuestionTranslatorPlugin {

  @ForAllGwNodes
  construct() {
  }

  override public function translate(key: String): String {
    var split = removeQuestionIdentifier(key).split("_", 2)//need to handle when key itself contains "_" like HOGAGenericPreQual_HOE
    switch(split[0]) {
      case "QuestionSet":
          return QuestionSetUtil.translateQuestionSet(split[1])
      case "Question":
          return QuestionSetUtil.translateQuestion(split[1])
      case "QuestionChoice":
          return QuestionSetUtil.translateChoice(split[1])
        default:
        return null
    }
  }

  private function removeQuestionIdentifier(key: String): String {
    return key.split("questionkey.")[1]
  }
}
