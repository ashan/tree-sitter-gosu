package gw.policy

uses gw.plugin.rateflow.IRateRoutineConfig
uses java.util.Map
uses gw.util.concurrent.LockingLazyVar
uses gw.lang.reflect.TypeSystem
uses java.util.List

@ReadOnly
/**
 * Configuration class for policy lines. Subtypes have to correspond to a naming convention:
 * <ul>
 *  <li>OOTB Package name starts with "gw.lob", client Package name starts witn "xxxxx.lob" where xxxxx is the client package prefix</li>
 *  <li>Subpackage has to be the short code of the policy line, i.e. "pa" for PersonalAutoLine</li>
 *  <li>Configuration class name prefix starts with capital case short code, i.e. PAConfiguration</li>
 *  <li>Fully qualified name example: gw.lob.pa.PAConfiguration</li>
 * </ul>
 */
abstract class PolicyLineConfiguration {

  static final var CONFIGURATION_PACKAGE = "gw.lob"
  static final var CONFIGURATION_SUFFIX = "Configuration"

  static final var CONFIGURATIONS = LockingLazyVar.make(\ -> {
    var configs : Map<InstalledPolicyLine, PolicyLineConfiguration> = {}
    for (line in InstalledPolicyLine.getTypeKeys(false)) {
      var className = createClassName(line)
      configs[line] = TypeSystem.getByFullName(className).TypeInfo.getCallableConstructor({}).Constructor.newInstance({}) as PolicyLineConfiguration
    }
    return configs
  })

  static final var LINES_BY_NAME = LockingLazyVar.make(\ -> {
    return InstalledPolicyLine.getTypeKeys(false).partitionUniquely( \ pl -> pl.UnlocalizedName)
  })

  /**
   * Creates a fully qualified class name using the short code of the passed in {@link InstalledPolicyLine}.
   *
   * @param line The policy line typekey to create the class name for
   * @return The generated class name
   */
  static function createClassName(line : InstalledPolicyLine) : String {
    var lineCode = line.Code.toLowerCase()
    var pkg : String
    switch(lineCode) {
      case "ind":
        pkg = "nz.co.acc.lob"
        break
      case "cpx":
        pkg = "nz.co.acc.lob"
        break
      case "emp":
        pkg = "nz.co.acc.lob"
        break
      case "shc":
        pkg = "nz.co.acc.lob"
        break
      case "aep":
        pkg = "nz.co.acc.lob"
        break// Add additional policy lines here
      default:
        pkg = CONFIGURATION_PACKAGE
    }
    var className = pkg + "." + lineCode + "." + lineCode.toUpperCase() + CONFIGURATION_SUFFIX
    return className
  }

  /**
   * Finds the cached instance of the {@link PolicyLineConfiguration} for the passed in {@link InstalledPolicyLine}.
   *
   * @deprecated Deprecated because of keyword conflict. Please use #getByLine instead.
   * @param line The policy line typekey for which to find the configuration class
   * @return An instance of {@link PolicyLineConfiguration} for the given policy line typekey
   */
  @Deprecated(:value="Deprecated in PC 8.0.1 because of keyword conflict. Please use #getByLine instead", :version="8.0.1")
  static function get(line: InstalledPolicyLine) : PolicyLineConfiguration {
    return getByLine(line)
  }

  /**
   * Finds the cached instance of the {@link PolicyLineConfiguration} for the passed in {@link InstalledPolicyLine}.
   *
   * @param line The policy line typekey for which to find the configuration class
   * @return An instance of {@link PolicyLineConfiguration} for the given policy line typekey
   */
  static function getByLine(line: InstalledPolicyLine) : PolicyLineConfiguration {
    return CONFIGURATIONS.get()[line]
  }

  /**
   * Finds the cached instance of the {@link PolicyLineConfiguration} for the passed in PolicyLinePattern code.
   *
   * @param lineCode The PolicyLinePattern code for which to find the configuration class
   * @return An instance of {@link PolicyLineConfiguration} for the given PolicyLinePattern code
   */
  static function getByCode(lineCode : String) : PolicyLineConfiguration {
    return getByLine(LINES_BY_NAME.get()[lineCode] as InstalledPolicyLine)
  }

  /**
   * Gets an instance of {@link IRateRoutineConfig} for this line.
   */
  abstract property get RateRoutineConfig() : IRateRoutineConfig

  abstract property get AllowedCurrencies() : List<Currency>
}