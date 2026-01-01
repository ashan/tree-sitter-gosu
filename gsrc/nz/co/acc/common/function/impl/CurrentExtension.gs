package nz.co.acc.common.function.impl

uses gw.api.util.ConfigAccess

uses java.io.FileInputStream
uses java.util.function.Supplier

/**
 * @author Ron Webb
 * @since 2019-06-14
 */
class CurrentExtension implements Supplier<Integer> {

  private var _version : int

  public construct(version : int) {
    _version = version
  }

  public construct() {
    using(var fis = new FileInputStream(ConfigAccess.getConfigFile("/config/extensions/extensions.properties"))) {
      var prop = new PropertyResourceBundle(fis)
      _version = prop.getString("version").toInt()
    }
  }

  override function get() : Integer {
    return _version
  }
}