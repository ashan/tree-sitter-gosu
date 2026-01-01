package nz.co.acc.common.function.impl

uses gw.api.system.server.ServerUtil

uses java.util.function.Supplier

class GetEnvironment implements Supplier<String> {
  private static final var _PC_ENV_PROPERTY = "gw.pc.env"
  private static final var _BC_ENV_PROPERTY = "gw.bc.env"
  private static final var _PRODUCT_ENV_PROPERTY_MAP : Map<String, String> = {"pc"->_PC_ENV_PROPERTY, "bc"->_BC_ENV_PROPERTY}

  private var _env : String

  construct(env : String) {
    _env = env
  }

  construct() {
    var productCode = ServerUtil.getProduct().ProductCode
    _env = System.getProperty(_PRODUCT_ENV_PROPERTY_MAP.get(productCode))
  }

  override function get() : String {
    return _env
  }
}