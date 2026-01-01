package edge.PlatformSupport

/**
 * Provides helper functions to retrieve translations.
 */
class TranslateUtil {
  public static function translate(displayKey: String): String {
    return gw.api.locale.DisplayKey.get(displayKey)
  }

  public static function translate(displayKey: String, argValues: Object[]) : String {
    return gw.api.locale.DisplayKey.get(displayKey, argValues)
  }
}
