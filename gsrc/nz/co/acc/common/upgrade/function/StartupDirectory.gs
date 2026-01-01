package nz.co.acc.common.upgrade.function

uses gw.api.util.ConfigAccess
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.upgrade.DatamodelUpgrade


uses java.io.File
uses java.nio.file.Paths
uses java.util.function.Supplier

/**
 * @author Ron Webb
 * @since 2019-06-14
 */
class StartupDirectory implements Supplier<String> {

  protected var _dir : String

  private final var LOG = StructuredLogger.CONFIG.withClass(StartupDirectory)

  public construct() {
    var prepareDir = \___upgradeDir : File -> {
      if (!___upgradeDir.exists()) {
        ___upgradeDir.mkdirs()
      }

      return ___upgradeDir.toString()
    }

    var upgradeDir = Paths.get(ConfigAccess.getModuleRoot("configuration").toString(), {"etc", "startup-scripts"}).toFile()

    prepareDir(upgradeDir)

    _dir = prepareDir(Paths.get(upgradeDir.toString(), {}).toFile())

    LOG.debug("Startup Dir: ${_dir}")
  }

  override function get() : String {
    return _dir
  }
}