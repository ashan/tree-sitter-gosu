package nz.co.acc.common.function.impl

uses gw.api.system.server.ServerUtil

uses java.util.function.Supplier

/**
 * @author Ron Webb
 * @since 2019-06-17
 */
class ServerEnvironment implements Supplier<String> {

  public final var DEFAULT_ENVIRONMENT : String = "dev"

  protected var _env : String

  construct(env : String) {
    _env=env
  }

  construct() {
    try {
      _env = ServerUtil.getEnv()
    }
    catch (npe : NullPointerException) {
      _env = DEFAULT_ENVIRONMENT
    }
  }

  override function get() : String {
    return _env
  }
}