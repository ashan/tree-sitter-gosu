package edge.PlatformSupport

uses gw.lang.reflect.features.FeatureReference
uses gw.surepath.suite.integration.logging.LogData
uses gw.surepath.suite.integration.logging.StructuredLogger
uses org.slf4j.LoggerFactory
uses java.lang.Throwable
uses java.lang.Exception

/**
 * Structured Edge Logger
 * Modify to extend Structured Logger
 * Comment out OOTB logger references
 * Implement calls to superclass
 */
class Logger extends StructuredLogger {

  //Structured Edge Logger - comment out OOTB logger references
  /*
  private var _logger = org.slf4j.LoggerFactory.getLogger("Edge")
  private var _classTag: String
  */

  /**
   * create a new Edge StructuredLogger instance with the log category being API.${classTag}
   * @param classTag - new logger sub-category
   */
  construct(classTag: String) {
    //_classTag = classTag
    super(LoggerFactory.getLogger(EDGE_SP.Name + "." + classTag))
  }

  /**
   * create a new Logger for a sub-category, all edge loggers are a sub-category of API
   * @param category - logger sub-category
   * @return - new Logger for category API with the specified sub-category
   */
  static function forCategory_SP(category:String) : Logger {
    return new Logger(category)
  }

  /**
   * basic debug log to maintain compatibility with OOTB Edge Logger
   * @param msg logged message text
   */
  public function logDebug(msg: String): LogData {
//    if (debugEnabled()) {
//      _logger.debug(buildLogStringBuilder(msg, null).toString())
//    }
    return super.debug(msg, null, StructuredLoggerEdgeHelper_SP.EDGE_LOGGER_PARAMETERS)
  }

  /**
   * debug exception log to maintain compatibility with OOTB Edge Logger
   * @param exception exception to be logged
   */
  public function logDebug(t: Throwable) {
//    if (debugEnabled()) {
//      _logger.debug(buildLogStringBuilder(null, t).toString())
//    }
    super.debug("${t.Message}\n${t.StackTraceAsString}", null,
        StructuredLoggerEdgeHelper_SP. EDGE_LOGGER_PARAMETERS)
  }

  /**
   * debug message with exception log to maintain compatibility with OOTB Edge Logger
   * @param msg logged message text
   * @param exception exception to be logged
   */
  public function logDebug(msg: String, t: Throwable) {
//    logDebug(msg)
//    logDebug(t)
    super.debug("${t.Message} / ${msg}\n${t.StackTraceAsString}", null,
        StructuredLoggerEdgeHelper_SP.EDGE_LOGGER_PARAMETERS)
  }

  /**
   * overloaded structured logger debug logging.
   * merge the edge logging data with the structured logger parameters
   * @param msg the log message.
   * @param objects an optional list of objects, entities, or BoundPropertyReferences
   * to add to the log message.
   * @param parameters an optional map of additional key/value pairs to add to the log message.
   */
  override public function debug(msg : String,
                                 objects : List<Object> = null,
                                 parameters : Map<String, Object> = null,
                                 method : FeatureReference = null,
                                 lightLog : boolean = false,
                                 errorCode : String = null,
                                 methodClazz : String = null,
                                 methodName : String = null) : LogData {
    return super.debug(msg, objects, StructuredLoggerEdgeHelper_SP.mergeNewParameters(parameters), method, lightLog, errorCode, methodClazz, methodName)
  }

  /* ------------------------------------------------------ */
  /**
   * basic info log to maintain compatibility with OOTB Edge Logger
   * @param msg logged message text
   */
  public function logInfo(msg: String): LogData {
//    _logger.info(buildLogStringBuilder(msg, null).toString())
    return super.info(msg, null, StructuredLoggerEdgeHelper_SP.EDGE_LOGGER_PARAMETERS)
  }

  /**
   * info exception log to maintain compatibility with OOTB Edge Logger
   * @param exception exception to be logged
   */
  public function logInfo(t: Throwable) {
//    _logger.info(buildLogStringBuilder(null, t).toString())
    super.info("${t.Message}\n${t.StackTraceAsString}", null,
        StructuredLoggerEdgeHelper_SP.EDGE_LOGGER_PARAMETERS)
  }

  /**
   * basic error log to maintain compatibility with OOTB Edge Logger
   * adds the edge logging parameters.
   * @param msg logged message text
   */
  public function logError(msg: String) {
//    _logger.error(buildLogStringBuilder(msg, null).toString())
    super.error(msg, null, null, null, StructuredLoggerEdgeHelper_SP.EDGE_LOGGER_PARAMETERS)
  }
  /**
   * error exception log to maintain compatibility with OOTB Edge Logger
   * adds the edge logging parameters.
   * @param exception exception to be logged
   */
  public function logError(t: Throwable) {
//    _logger.error(buildLogStringBuilder(null, t).toString())
    if ( t typeis Exception ) {
      super.error(t.Message, null, t, null, StructuredLoggerEdgeHelper_SP.EDGE_LOGGER_PARAMETERS)
    } else {
      var ex = new Exception(t)
      super.error(t.Message, null, ex, null, StructuredLoggerEdgeHelper_SP.EDGE_LOGGER_PARAMETERS)
    }
  }
  /**
   * error message with exception log to maintain compatibility with OOTB Edge Logger
   * @param msg logged message text
   * @param exception exception to be logged
   */
  public function logError(msg: String, t: Throwable) {
//    logError(msg)
//    logError(t)
    if ( t typeis Exception ) {
      super.error(msg, null, t, null, StructuredLoggerEdgeHelper_SP.EDGE_LOGGER_PARAMETERS)
    } else {
      var ex = new Exception(t)
      super.error(msg, null, ex, null, StructuredLoggerEdgeHelper_SP.EDGE_LOGGER_PARAMETERS)
    }
  }

  /**
   * overloaded structured logger info logging. merge the edge logging data
   * with the structured logger parameters
   * @param msg the log message.
   * @param objects an optional list of objects, entities, or BoundPropertyReferences to
   * add to the log message.
   * @param parameters an optional map of additional key/value pairs to add to the log message.
   * @param method an optional reference to the method calling this log statement.
   */
  override function info(msg : String,
                         objects : List<Object> = null,
                         parameters : Map<String, Object> = null,
                         method : FeatureReference = null,
                         lightLog : boolean = false,
                         errorCode : String = null,
                         methodClazz : String = null,
                         methodName : String = null) :LogData {
    return super.info(msg, objects, StructuredLoggerEdgeHelper_SP.mergeNewParameters(parameters), method, lightLog, errorCode, methodClazz, methodName)
  }

  /* ------------------------------------------------------ */
  /**
   * basic warning log to maintain compatibility with OOTB Edge Logger
   * @param msg logged message text
   */
  public function logWarn(msg: String) {
//    _logger.warn(buildLogStringBuilder(msg, null).toString())
    super.warn(msg, null, null, null, StructuredLoggerEdgeHelper_SP.EDGE_LOGGER_PARAMETERS)
  }

  /**
   * warn exception log to maintain compatibility with OOTB Edge Logger
   * @param exception exception to be logged
   */
  public function logWarn(t : Throwable) {
//    _logger.warn(buildLogStringBuilder(null, t).toString())
    super.warn(t.Message, null, ((t typeis Exception) ? t : new Exception(t)), null,
        StructuredLoggerEdgeHelper_SP.EDGE_LOGGER_PARAMETERS)
  }

  /**
   * warn message with exception log to maintain compatibility with OOTB Edge Logger
   * @param msg logged message text
   * @param exception exception to be logged
   */
  public function logWarn(msg: String, t: Throwable) {
//    logWarn(msg)
//    logWarn(t)
    if ( t typeis Exception ) {
      super.warn(msg, null, t, null, StructuredLoggerEdgeHelper_SP.EDGE_LOGGER_PARAMETERS)
    } else {
      var ex = new Exception(t)
      super.warn(msg, null, ex, null, StructuredLoggerEdgeHelper_SP.EDGE_LOGGER_PARAMETERS)
    }
  }
  /**
   * overloaded structured logger warning logging.
   * merge the edge logging data with the structured logger parameters
   * @param msg the log message.
   * @param method an optional reference to the method calling this log statement.
   * @param ex an optional Exception.
   * @param objects an optional list of objects, entities, or BoundPropertyReferences to
   *      add to the log message.
   * @param parameters an optional map of additional key/value pairs to add to the log message.
   */
  override public function warn(msg : String,
                                method : FeatureReference,
                                ex : Exception = null,
                                objects : List<Object> = null,
                                parameters : Map<String, Object> = null,
                                errorCode : String = null,
                                methodClazz : String = null,
                                methodName : String = null) : LogData {
    return super.warn(msg, method, ex, objects, StructuredLoggerEdgeHelper_SP.mergeNewParameters(parameters), errorCode, methodClazz, methodName)
  }

  /**
   * overloaded structured logger error logging.
   * merge the edge logging data with the structured logger parameters
   * @param msg the log message.
   * @param method an optional reference to the method calling this log statement.
   * @param ex an optional Exception.
   * @param objects an optional list of objects, entities, or BoundPropertyReferences to be
   *      added to the log message.
   * @param parameters an optional map of additional key/value pairs to add to the log message.
   */
  override public function error(msg : String,
                                 method : FeatureReference,
                                 ex : Exception = null,
                                 objects : List<Object> = null,
                                 parameters : Map<String, Object> = null,
                                 errorCode : String = null,
                                 methodClazz : String = null,
                                 methodName : String = null) :LogData {
    return super.error(msg, method, ex, objects, StructuredLoggerEdgeHelper_SP.mergeNewParameters(parameters), errorCode, methodClazz, methodName)
  }

  public function debugEnabled(): Boolean {
    return super.DebugEnabled
  }

  public static function addRequestId(value : Object) {
    resetInfo()
    if(value != null) {
        org.slf4j.MDC.put("JsonRpcId", value.toString())
    }
  }

  public static function resetInfo(){
    org.slf4j.MDC.remove("JsonRpcId")
  }

}