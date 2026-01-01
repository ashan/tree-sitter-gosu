package edge.capabilities.locale.local

/**
 * Plugin used to get question sets translations.
 */
interface IQuestionTranslatorPlugin {
  public function translate(key: String): String
}
