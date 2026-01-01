package gw.surepath.suite.integration.logging

uses org.jetbrains.annotations.NonNls
uses org.slf4j.Logger

class StructuredLogger_ACC extends StructuredLogger {
  public static final var JSON_FORMAT_KEY : String = "jsonFormat_ACC" // ACC custom parameter to toggle JSON logging
  private var _className : String = null
  private final var _separator = System.getProperty("line.separator")

  /**
   * Construct a StructuredLogger from an existing logger.
   *
   * @param logger the existing logger.
   */
  protected construct(logger : Logger) {
    super(logger)
  }

  public construct(logger : Logger, className : String) {
    super(logger)
    _logger = logger
    _className = className
  }

  function withClass(clazz : Object) : StructuredLogger_ACC {
    var className : String = null
    if (clazz typeis String) {
      className = clazz
    } else if (clazz typeis Type) {
      className = clazz.RelativeName
    } else {
      className = (typeof clazz).TypeInfo.Name
    }
    return new StructuredLogger_ACC(_logger, className)
  }

  public function error_ACC(@NonNls msg : String, ex : Exception = null) {
    super.error(msg, null, ex)
  }

  public function warn_ACC(msg : String) {
    super.warn(msg, null)
  }

  public function warn_ACC(msg : String, ex: Exception) {
    super.warn(msg, null, ex)
  }

  override protected function formatAsString(
      logData : LogData,
      lightLogging : boolean = false) : String {

    if (_className != null) {
      logData.className = _className
    }

    if (isJsonFormatEnabled()) {
      return super.formatAsString(logData, lightLogging)
    } else {
      return formatAsUnstructuredString(logData)
    }
  }

  /**
   * Traditional unstructured log format
   *
   * @param logData
   * @return
   */
  private function formatAsUnstructuredString(logData : LogData) : String {
    var sb = new StringBuffer()

    if (logData.className != null) {
      sb.append(logData.className)
      if (logData.functionName != null) {
        sb.append(".")
      }
    }
    if (logData.functionName != null) {
      sb.append(logData.functionName)
      sb.append("()")
    }
    if (logData.className != null or logData.functionName != null) {
      sb.append(" - ")
    }
    sb.append(logData.message)
    if (logData.stackTrace != null) {
      sb.append(_separator)
      sb.append(logData.stackTrace)
    }
    return sb.toString()
  }

  static function isJsonFormatEnabled() : boolean {
    return StructuredLoggerProperties.isJsonFormat_ACC == "true"
  }

}