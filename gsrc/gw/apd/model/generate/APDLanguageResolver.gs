package gw.apd.model.generate

@Export
class APDLanguageResolver {

  public static function resolveProductModelDisplayPropertiesFilePaths(languageType: LanguageType) : String[] {
    return (languageType.Code == LanguageType.TC_EN_US.Code) ?
        Generator.LOCALEDIRECTORY.concat(new String[]{"productmodel.display.properties"}) :
        Generator.LOCALEDIRECTORY.concat(new String[]{"productmodel.display_${languageType.Code}.properties"})
  }

  public static function resolveTempProductModelDisplayPropertiesFilePaths(languageType: LanguageType) : String[] {
    return (languageType.Code == LanguageType.TC_EN_US.Code) ?
        Generator.LOCALEDIRECTORY.concat(new String[]{"productmodel.display.temp"}) :
        Generator.LOCALEDIRECTORY.concat(new String[]{"productmodel.display_${languageType.Code}.temp"})
  }

  public static function resolveDisplayPropertiesFilePaths(languageType: LanguageType) : String[] {
    return (languageType.Code == LocaleType.TC_EN_US.Code) ?
        Generator.LOCALEDIRECTORY.concat(new String[]{"display.properties"}) :
        Generator.LOCALEDIRECTORY.concat(new String[]{"display_${languageType.Code}.properties"})
  }

  public static function resolveTempDisplayPropertiesFilePaths(languageType: LanguageType) : String[] {
    return (languageType.Code == LocaleType.TC_EN_US.Code) ?
        Generator.LOCALEDIRECTORY.concat(new String[]{"display.temp"}) :
        Generator.LOCALEDIRECTORY.concat(new String[]{"display_${languageType.Code}.temp"})
  }

  public static function resolveTypelistPropertiesFilePaths(languageType : LanguageType) : String[] {
    return (languageType.Code == LanguageType.getTypeKey("en_US").Code) ?
        Generator.LOCALEDIRECTORY.concat(new String[]{"typelist.properties"}) :
        Generator.LOCALEDIRECTORY.concat(new String[]{"typelist_${languageType.Code}.properties"})
  }

  public static function resolveTempTypelistPropertiesFilePaths(languageType : LanguageType) : String[] {
    return (languageType.Code == LanguageType.getTypeKey("en_US").Code) ?
        Generator.LOCALEDIRECTORY.concat(new String[]{"typelist.temp"}) :
        Generator.LOCALEDIRECTORY.concat(new String[]{"typelist_${languageType.Code}.temp"})
  }
}