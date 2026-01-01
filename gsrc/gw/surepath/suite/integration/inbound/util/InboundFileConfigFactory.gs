package gw.surepath.suite.integration.inbound.util

uses gw.api.database.Query
uses gw.api.properties.RuntimePropertyRetriever
uses gw.external.configuration.SubstitutionProperties

class InboundFileConfigFactory {
  /**
   * The namespace for configuration properties specifying the name of an outbound file configuration.
   *
   * @see #makeConfigFromProperty(String)
   */
  public static final var PROPERTY_NAMESPACE : String = "integration"

  private construct() {
    // factory
  }

  /**
   * Makes an outbound file configuration from the value of the configuration property named {@code propertyName} in namespace {@link #PROPERTY_NAMESPACE}.
   *
   * @param propertyName the name of a configuration property in namespace {@link #PROPERTY_NAMESPACE}
   * @return an outbound file configuration, or {@code null} if the configuration named by the property does not exist
   * @throws IllegalArgumentException if no property named {@code propertyName} exists in namespace {@link #PROPERTY_NAMESPACE}
   */
  static function makeConfigFromProperty(propertyName : String) : InboundFileConfig {
    var configName = new SubstitutionProperties().lookupValue(PROPERTY_NAMESPACE, propertyName)
    if (configName == null) {
      throw new IllegalArgumentException("Cannot get config name from property \"${propertyName}\" in namespace \"${PROPERTY_NAMESPACE}\". Is the property set for the environment?")
    }

    return makeConfig(configName)
  }

  static function makeConfig(configName : String) : InboundFileConfig {
    return Query.make(InboundFileConfig)
        .compare(InboundFileConfig#Name, Equals, configName)
        .select().AtMostOneRow
  }
}