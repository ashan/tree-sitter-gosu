package edge.capabilities.locale.util

uses gw.lang.reflect.IType

class TypeSystemUtil {
  public static function getTypeListByName(name: String): IType {
    return gw.lang.reflect.TypeSystem.getByFullName("typekey."+name)
  }
}
