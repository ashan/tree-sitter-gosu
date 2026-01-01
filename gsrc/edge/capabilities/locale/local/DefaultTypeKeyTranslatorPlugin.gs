package edge.capabilities.locale.local

uses gw.lang.reflect.IType
uses java.lang.Exception
uses gw.entity.ITypeList
uses edge.PlatformSupport.Reflection
uses edge.PlatformSupport.Logger
uses edge.di.annotations.ForAllGwNodes
uses edge.capabilities.locale.util.TypeSystemUtil

class DefaultTypeKeyTranslatorPlugin {

  final private static var LOGGER = new Logger(Reflection.getRelativeName(DefaultTypeKeyTranslatorPlugin))

  @ForAllGwNodes
  construct() {

  }

  function translate(key: String): String {
    var typeList = removeTypeKeyIdentifier(key).split("\\.") // split the TypeKey type and code
    var type: IType
    try {
      type = TypeSystemUtil.getTypeListByName(typeList[0])
    }catch (e: Exception) {
      return null
    }
    return (type as ITypeList).getTypeKey(typeList[1]).DisplayName
  }

  private function removeTypeKeyIdentifier(key: String): String {
    return key.split("typekey.")[1]
  }
}
