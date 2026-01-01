package edge.capabilities.locale.util

uses gw.api.util.LocaleUtil
uses com.guidewire.pl.system.dependency.PLDependencies
uses java.util.Map
uses gw.api.util.CurrencyUtil
uses gw.api.name.NameLocaleSettings
uses gw.api.address.AddressCountrySettings
uses gw.api.util.PhoneUtil

class LocaleHelper {
  /**
   * A helper function to run a block using the locale and language specified by a a locale string.
   *
   * @param name A string representing the key value for the locale.
   * @param runBlock Code block to run using the specified locale as the default locale.
   */
  public static function runWithLocale(name:String, runBlock()) {
    var loc = LocaleType.get(name);
    if ( loc == null ) {
      loc = LocaleUtil.DefaultLocaleType
    }

    var lang : LanguageType
    if ( name != null ) {
      var variantName = name+"_edg";

      // Search first for the locale's edge variant
      lang = LanguageType.get(variantName);
      if ( lang == null ) {
        // If no variant found, search for the locale language
        lang = LanguageType.get(name);
        if ( lang == null ) {
          var langPrefix = name.indexOf('_');
          if ( langPrefix > 0 ) {
            name = name.substring(0,langPrefix);
            variantName = name + "_edg";
            lang = LanguageType.get(variantName)
            if ( lang == null ) {
              lang = LanguageType.get(name);
            }
          }
        }
      }
    }

    if ( lang == null ) {
      lang = LocaleUtil.DefaultLanguageType
    }
      LocaleUtil.runAsCurrentLocaleAndLanguage(LocaleUtil.DefaultLocale, LocaleUtil.toLanguage(lang),runBlock)
  }

  public static function getAllLanguages():List<LanguageType> {
    return LocaleUtil.AllLanguages
  }

  private static function getBaseLocaleCode() : String {
    var currentCode = LocaleUtil.CurrentLanguage.Code
    if ( currentCode.endsWith("_edg") ) {
      return currentCode.substring(0,currentCode.length-4)
    } else {
      return currentCode;
    }
  }

  public static function getCountrySettings(settings:Map<String,Object>) {
    var country = LocaleUtil.DefaultCountry
    var addressSettings = AddressCountrySettings.getSettings(country)
    var addressDefinition = PLDependencies.getAddressConfiguration().getAddressDefinition(country)
    settings.put("address", {
        "PostalCodeRegex" -> addressDefinition.getValidator("PostalCode").Value,
        "pcfMode" -> addressSettings.PCFMode ?: "default",
        "fieldNames" -> addressSettings.VisibleFields*.Name
    })
    settings.put("currency", {
      "symbol" -> "$",
      "fractionSize" -> LocaleUtil.CurrentLocale.SingleCurrencyFormat.FractionDigits
    })
    settings.put("name",{
      "mode" -> NameLocaleSettings.PCFMode,
      "formatMode" -> NameLocaleSettings.TextFormatMode ?: "default",
      "visibleFields" -> NameLocaleSettings.VisibleFields*.Name
    })
    settings.put("country", {"code"->country.Code,"name"->country.DisplayName})
    settings.put("phone", {
        "sample" -> PhoneUtil.getExamplePhoneNumber(PhoneUtil.UserDefaultPhoneCountry),
        "UserDefaultPhoneCountry"->PhoneUtil.UserDefaultPhoneCountry.Code})
  }
}
