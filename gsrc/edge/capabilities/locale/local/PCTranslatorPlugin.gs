package edge.capabilities.locale.local

uses edge.di.annotations.InjectableNode

class PCTranslatorPlugin extends DefaultTranslatorPlugin {
  var _questionTranslator : IQuestionTranslatorPlugin

  @InjectableNode
  construct(displayKeys:DefaultDisplayKeyTranslatorPlugin, typeKeys:DefaultTypeKeyTranslatorPlugin, questionSets:IQuestionTranslatorPlugin) {
    super(displayKeys,typeKeys)
    _questionTranslator = questionSets
  }

  override function translateKey(key: String): String {
    var splitKey = key.split("\\.")
    if ( key.startsWith("questionkey.") ) {
      return _questionTranslator.translate(key)
    } else {
      return super.translateKey(key)
    }
  }
}
