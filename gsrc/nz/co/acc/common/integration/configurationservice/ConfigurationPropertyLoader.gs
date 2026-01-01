package nz.co.acc.common.integration.configurationservice

uses gw.api.util.ConfigAccess
uses gw.surepath.suite.integration.logging.StructuredLogger
uses gw.util.concurrent.LockingLazyVar
uses nz.co.acc.plm.common.configurationservice.ConfigurationProperty

uses java.io.File

/**
 * This thread safe singleton service loads properties from an external properties file. The name of the file is derived
 * based on {@link ACC_ENV_ID_PROP} and {@link GW_SERVER_MODE_PROP}. All the propeties files are expected be located under
 * {@link PROP_CONFIGURATION_ROOT}.
 * <p>
 * This loader gets invoked by the {@link ConfigurationPropertiesStartablePlugin} at instance bootstrap.
 * <p>
 * Created by Kaushalya Samarasekera
 */
class ConfigurationPropertyLoader {
  private static var _log = StructuredLogger.CONFIG.withClass(ConfigurationPropertyLoader)
  /**
   * Root directory of where the *-configuration.properties files are located.
   */
  final static var PROP_CONFIGURATION_ROOT = new File(ConfigAccess.getModuleRoot("configuration"), "/config/properties/")

  /**
   * This is where the singleton is stored internally. Leveraging {@code LockingLazyVar}'s double-checked locking pattern for thread safety.
   */
  final static var _instance = LockingLazyVar.make(\-> new ConfigurationPropertyLoader())

  /**
   * The file where the properties ready from.
   */
  static var _source: File as readonly SourceFile

  /**
   * List of all the properties read from the source file.
   */
  var _propertiesMap: Map<String, String>

  /**
   * TODO-KS: Javadoc
   *
   * @return
   */
  static property get Singleton(): ConfigurationPropertyLoader {
    return _instance.get()
  }

  /**
   * Resulting status of the property initialisation process.
   *
   * @return {@code true} if the properties list for initialised successfully during init().
   */
  property get IsInitialised(): Boolean {
    return this._propertiesMap != null && !this._propertiesMap.isEmpty()
  }

  /**
   * Default initialisation process. Uses default property configuration root directory and System properties of the JVM as inputs.
   */
  internal function init() {
    init(PROP_CONFIGURATION_ROOT)
  }

  /**
   * Initialised the properties based on a given (properties) root directory
   *
   * @param baseDir          root directory to scan for the properties files
   * @param systemProperties injected list of system properties
   */
  internal function init(baseDir: File) {
    var fn = "init"

    if (baseDir?.exists()) {

      var propertiesFile = new File(baseDir, "configuration.properties")

      if (!propertiesFile.exists()) {
        logError(fn, "Configuration properties file not found. File expected: ${propertiesFile.getAbsolutePath()}")
        return
      }

      this._propertiesMap = Properties.readFromPropertiesFile(propertiesFile)
      this._source = propertiesFile

    } else {
      logWarn(fn, "No location specified or exists in file system to read configuration properties. Location: ${baseDir.getAbsolutePath()}")
    }

    verifyConfiguration()
  }

  private function verifyConfiguration() {
    for (prop in ConfigurationProperty.values()) {
      var value = this._propertiesMap?.get(prop.PropertyName)
      if (value == null) {
        logError("verifyConfiguration", "Config entry missing in configuration.properties: [${prop.PropertyName}]")
      }
    }
  }

  internal function setValueFor(propName: String, propValue: String) {
    this._propertiesMap.put(propName, propValue)
  }


  /**
   * Returns value for a given configuration property. If value not present, the default value from the enum constant will be returned.
   *
   * @param prop the enum constant that represents the property
   */
  function getValueFor(prop: ConfigurationProperty): String {
    final var fn = "getValueFor"
    var value = this._propertiesMap?.get(prop.PropertyName)

    if (value == null) {
      if (_log.DebugEnabled) {
        logDebug(fn, "Configuration property [${prop.PropertyName}] not defined in configuration.properties. Returning default value.")
      }
      return prop.DefaultValue
    } else {
      return value
    }
  }

  /**
   * Clears internal state. This removes all the properties, previously loaded from a file, from memory.
   */
  function reset() {
    var fn = "reset"
    logWarn(fn, "Removing all custom configuration properties from memory. Source: ${this._source.getAbsolutePath()}. ***Investigate if wasn't deliberate!***")
    this._propertiesMap?.clear()
    this._source = null
  }

  function logInfo(fn: String, msg: String) {
    _log.info(msg)
  }

  function logWarn(fn: String, msg: String) {
    _log.warn_ACC(msg)
  }

  function logError(fn: String, msg: String) {
    _log.error_ACC(msg)
  }

  function logDebug(fn: String, msg: String) {
    _log.debug(msg)
  }
}
