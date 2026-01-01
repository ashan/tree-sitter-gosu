package edge.capabilities.gpa.locale

uses edge.capabilities.locale.local.IQuestionTranslatorPlugin
uses edge.di.annotations.InjectableNode
uses edge.PlatformSupport.TranslateUtil

/**
 * Custom GPA implementation of question translator plugin.
 */
class GPAQuestionTranslatorPlugin implements IQuestionTranslatorPlugin {
  private var _peer: IQuestionTranslatorPlugin

  @InjectableNode
  construct(peer: IQuestionTranslatorPlugin) {
    this._peer = peer
  }

  override public function translate(key: String): String {
    var gpaCustomDisplayKey = 'Edge.GPA.' + key
    var translation = TranslateUtil.translate(gpaCustomDisplayKey)

    // check if custom translation is provided
    if (translation !== gpaCustomDisplayKey) {
      return translation// custom GPA translation
    } else {
      return _peer.translate(key)// fallback
    }
  }
}
