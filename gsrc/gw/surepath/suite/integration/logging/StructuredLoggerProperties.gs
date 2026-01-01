package gw.surepath.suite.integration.logging


uses gw.util.PropertiesFileAccess

public class StructuredLoggerProperties {
  private static property get StructuredLoggerProperties() : Properties {
    // Using getProperties reads the file only once. The Properties are cached as a static property.
    // You must use the fully qualified path to the properties file even though MyPropsAccess and
    // MyProps.properties are in the same folder.
    return PropertiesFileAccess.getProperties("gw/surepath/suite/integration/logging/structuredlogger.properties")
  }

  public static property get isRemoveCRLF() : String {
    return StructuredLoggerProperties.getProperty(StructuredLogger.REMOVE_CRLF_KEY)
  }

  public static property get isLightLogging() : String {
    return StructuredLoggerProperties.getProperty(StructuredLogger.LIGHT_LOGGING_KEY)
  }

  public static property get isJsonFormat_ACC() : String {
    return StructuredLoggerProperties.getProperty(StructuredLogger_ACC.JSON_FORMAT_KEY)
  }

}