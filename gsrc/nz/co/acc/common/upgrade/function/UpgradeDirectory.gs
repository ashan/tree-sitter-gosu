package nz.co.acc.common.upgrade.function

uses gw.api.util.ConfigAccess
uses gw.pl.util.FileUtil
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.function.Funxion
uses nz.co.acc.common.function.impl.CurrentExtension
uses nz.co.acc.common.function.impl.ServerEnvironment
uses nz.co.acc.common.upgrade.DatamodelUpgrade

uses java.io.File
uses java.nio.file.Paths
uses java.util.function.Supplier

/**
 * @author Ron Webb
 * @since 2019-06-14
 */
class UpgradeDirectory implements Supplier<String> {

  public static final var DEFAULT_SCRIPT_DIR : String = "."

  protected var _upgradeDir : String

  private final var LOG = StructuredLogger.CONFIG.withClass(UpgradeDirectory)

  public construct(upgradeDir : String, scriptsDir : String) {
    _upgradeDir = Paths.get(upgradeDir, {scriptsDir}).toString()
  }

  public construct() {
    var prepareDir = \___upgradeDir : File -> {
      if (!___upgradeDir.exists()) {
        ___upgradeDir.mkdirs()
      }

      return ___upgradeDir.toString()
    }

    var upgradeDir = Paths.get(ConfigAccess.getModuleRoot("configuration").toString(), {"etc", "upgrade-scripts"}).toFile()

    prepareDir(upgradeDir)

    var extension = String.valueOf(new CurrentExtension().get())

    _upgradeDir = prepareDir(Paths.get(upgradeDir.toString(), {extension}).toFile())

    LOG.debug("Upgrade Dir: ${_upgradeDir}")
  }

  override function get() : String {
    return _upgradeDir
  }
}