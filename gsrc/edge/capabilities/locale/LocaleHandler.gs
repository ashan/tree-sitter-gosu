package edge.capabilities.locale

uses edge.PlatformSupport.Logger
uses edge.PlatformSupport.Reflection
uses edge.jsonrpc.annotation.JsonRpcUnauthenticatedMethod
uses java.util.Map
uses edge.jsonrpc.IRpcHandler
uses edge.di.annotations.InjectableNode
uses java.util.HashMap
uses edge.capabilities.locale.local.ITranslatorPlugin
uses gw.api.util.LocaleUtil
uses edge.capabilities.locale.util.LocaleHelper
uses edge.PlatformSupport.Locale

class LocaleHandler implements IRpcHandler {
  final private static var LOGGER = new Logger(Reflection.getRelativeName(LocaleHandler))

  var _translator : ITranslatorPlugin

  @InjectableNode
  construct(aTranslator:ITranslatorPlugin) {
    _translator = aTranslator
  }

  @JsonRpcUnauthenticatedMethod
  public function getLocaleConfig() : Map<String,Object> {
    var locales = getLanguages()
    var result = new HashMap<String,Object>() {
      "locales" -> locales,
      "preferredLocale" -> Locale.DefaultLanguage.Code
    }
    LocaleHelper.getCountrySettings(result)
    return result
  }

  /**
   * Display keys to translate
   * Returns a map of key => translation
   */
  @JsonRpcUnauthenticatedMethod
  public function translate(locale: String, keys: List<String>): Map<String, String> {
    var translations: Map<String, String>
    LocaleHelper.runWithLocale(locale, \-> {
      translations = _translator.translate(keys)
    })
    return translations
  }

  private function getLanguages(): Map<String,String> {
    var locales = new HashMap<String,String>()
    LocaleUtil.getAllLanguages()
        .where( \ l -> !l.Code.endsWith("_edg") )
        .each( \ l -> locales.put(l.Code, l.DisplayName) )
    return locales
  }

}
