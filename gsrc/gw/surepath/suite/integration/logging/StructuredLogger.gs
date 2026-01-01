package gw.surepath.suite.integration.logging

uses gw.api.system.server.ServerUtil
uses gw.lang.reflect.features.FeatureReference
uses gw.pl.logging.LoggerCategory
uses org.apache.commons.lang3.StringUtils
uses org.jetbrains.annotations.NonNls
uses org.slf4j.Logger
uses org.slf4j.LoggerFactory
uses org.slf4j.MDC
uses java.net.InetAddress
uses java.util.concurrent.locks.ReentrantLock


/**
 * Wrapper around Logger that formats log messages for consistency.
 * This logger uses Guidewire's Common Logging Format (CLF) and outputs
 * log entries as structured Json
 *
 * There are functions which support tracking the timing of operations. See startTiming() and endTiming() for more info.
 * When you use startTiming, each time you output to the log, the elapsed time will be output.
 *
 * There is a special setting you can invoke called LightLogging.
 * LightLogging allows you to log just the message, userId and ServerId and timing information.
 *
 * NOTE: The message you send in to a log call can contain the following string : className::functionName
 * If it does, and if you havent passed in the Method parameter, then that information will be parsed out of the message
 * and placed in the className and functionName fields. For compute sensitive operations you may want to consider passing in as part of the message then as a
 * Method parameter since there is larger performance implications in reflecting on the Method parameter.
 *
 *
 * Mainteance Notes:
 * -----------------
 *   dec14 2020 - bg - added optional class and function arguments to logging, to allow for bypass of using FeatureReference parameter (For performance). Also changed logging when optional parameters such as serverShardId couldnt be scraped - now sending to debug log instead of error log in TOOLS.
 *
 *
 */
class StructuredLogger {
  public static final var ENCRYPTION_KEY : String ="encryptionKey"
  public static final var REMOVE_CRLF_KEY : String = "removeCRLF" // do we want to remove new lines from the logging output?
  public static final var TIME_MS_KEY : String = "elapsedTimeMs" // the elaspsed time key for MDC
  public static final var START_TIME_KEY : String = "startTimeMs" // used inside the mdc to demarc the start of an operation.
  public static final var LIGHT_LOGGING_KEY : String = "lightLogging" // the key to use in the MDC when you want to enable light logging.
  public static final var ERROR_CODE_KEY : String = "errorCode" // used to communicate with the MDC in case you have stamped an error code in it
  // Static loggers that wrap the existing LoggerCategory loggers
  public static final var PLUGIN : StructuredLogger_ACC = new StructuredLogger_ACC(LoggerCategory.PLUGIN)
  public static final var MESSAGING : StructuredLogger_ACC = new StructuredLogger_ACC(LoggerCategory.MESSAGING)
  public static final var MESSAGING_LEASE : StructuredLogger_ACC = new StructuredLogger_ACC(LoggerCategory.MESSAGING_LEASE)
  public static final var MESSAGING_LEASE_EVENT : StructuredLogger_ACC = new StructuredLogger_ACC(LoggerCategory.MESSAGING_LEASE_EVENT)
  public static final var MESSAGING_DESTMGR : StructuredLogger_ACC = new StructuredLogger_ACC(LoggerCategory.MESSAGING_DESTMGR)
  public static final var MESSAGING_MESSAGE : StructuredLogger_ACC = new StructuredLogger_ACC(LoggerCategory.MESSAGING_MESSAGE)
  public static final var MESSAGING_PREPROCESSOR : StructuredLogger_ACC = new StructuredLogger_ACC(LoggerCategory.MESSAGING_PREPROCESSOR)
  public static final var MESSAGING_PREPROCESSOR_NODE : StructuredLogger_ACC = new StructuredLogger_ACC(LoggerCategory.MESSAGING_PREPROCESSOR_NODE)
  public static final var MESSAGING_PERF : StructuredLogger_ACC = new StructuredLogger_ACC(LoggerCategory.MESSAGING_PERF)
  public static final var MESSAGING_EXAMPLES : StructuredLogger_ACC = new StructuredLogger_ACC(LoggerCategory.MESSAGING_EXAMPLES)
  public static final var API : StructuredLogger_ACC = new StructuredLogger_ACC(LoggerCategory.API)
  public static final var PROFILER : StructuredLogger_ACC = new StructuredLogger_ACC(LoggerCategory.PROFILER)
  public static final var CONFIG : StructuredLogger_ACC = new StructuredLogger_ACC(LoggerCategory.CONFIG)
  public static final var TOOLS : StructuredLogger_ACC = new StructuredLogger_ACC(LoggerCategory.TOOLS)
  public static final var CONFIG_DISPLAY : StructuredLogger_ACC = new StructuredLogger_ACC(LoggerCategory.CONFIG_DISPLAY)
  public static final var CONFIG_UPGRADER : StructuredLogger_ACC = new StructuredLogger_ACC(LoggerCategory.CONFIG_UPGRADER)
  public static final var CONFIG_SERVICE : StructuredLogger_ACC = new StructuredLogger_ACC(LoggerCategory.CONFIG_SERVICE)
  public static final var TEST : StructuredLogger_ACC = new StructuredLogger_ACC(LoggerCategory.TEST)
  public static final var TEST_DATABASE : StructuredLogger_ACC = new StructuredLogger_ACC(LoggerCategory.TEST_DATABASE)
  public static final var RULES : StructuredLogger_ACC = new StructuredLogger_ACC(LoggerCategory.RULES)
  public static final var INTEGRATION : StructuredLogger_ACC = new StructuredLogger_ACC(LoggerCategory.INTEGRATION)
  public static final var INTEGRATION_WORKAGENT : StructuredLogger_ACC = new StructuredLogger_ACC(LoggerCategory.INTEGRATION_WORKAGENT)
  public static final var INTEGRATION_MSGREPLY : StructuredLogger_ACC = new StructuredLogger_ACC(LoggerCategory.INTEGRATION_MSGREPLY)
  public static final var INTEGRATION_JMS : StructuredLogger_ACC = new StructuredLogger_ACC(LoggerCategory.INTEGRATION_JMS)
  public static final var INTEGRATION_FILE : StructuredLogger_ACC = new StructuredLogger_ACC(LoggerCategory.INTEGRATION_FILE)
  public static final var INTEGRATION_CUSTOM : StructuredLogger_ACC = new StructuredLogger_ACC(LoggerCategory.INTEGRATION_CUSTOM)
  public static final var KPI : StructuredLogger_ACC = new StructuredLogger_ACC(LoggerCategory.KPI)
  public static final var MESSAGING_KPI : StructuredLogger_ACC = new StructuredLogger_ACC(LoggerCategory.MESSAGING_KPI)
  public static final var KPI_PROFILER : StructuredLogger_ACC = new StructuredLogger_ACC(LoggerCategory.KPI_PROFILER)
  public static final var IL_CONFIG : StructuredLogger_ACC = new StructuredLogger_ACC(LoggerCategory.IL_CONFIG)
  public static final var EDGE_SP : StructuredLogger_ACC = new StructuredLogger_ACC(LoggerFactory.getLogger("Edge_SP"));

  //
  private static final var _obfuscationLock : ReentrantLock = new ReentrantLock() // internal lock object used for obfuscation
  //
  private static var REGISTERED_OBFUSCATIONS : Map<String, IPIIObfuscation>
  //
  protected var _logger : Logger as readonly Logger
  /**
   * Construct a StructuredLogger from an existing logger.
   *
   * @param logger the existing logger.
   */
  protected construct(logger : Logger) {
    _logger = logger
    RegisteredObfuscations.INSTANCE.registerObfuscations()
  }

  /**
   * Determine whether trace logging is enabled.
   *
   * @return true if trace logging is enabled, false if not.
   */
  public property get TraceEnabled() : boolean {
    return _logger.TraceEnabled
  }

  /**
   * Determine whether debug logging is enabled.
   *
   * @return true if debug logging is enabled, false if not.
   */
  public property get DebugEnabled() : boolean {
    return _logger.DebugEnabled
  }

  /**
   * Determine whether info logging is enabled.
   *
   * @return true if info logging is enabled, false if not.
   */
  public property get InfoEnabled() : boolean {
    return _logger.InfoEnabled
  }

  /**
   * Determine whether warn logging is enabled.
   *
   * @return true if warn logging is enabled, false if not.
   */
  public property get WarnEnabled() : boolean {
    return _logger.WarnEnabled
  }

  /**
   * Determine whether error logging is enabled.
   *
   * @return true if error logging is enabled, false if not.
   */
  public property get ErrorEnabled() : boolean {
    return _logger.ErrorEnabled
  }

  /**
   * Get the logger category name.
   *
   * @return the logger category name.
   */
  public property get Name() : String {
    return _logger.Name
  }

  /**
   * Create a StructuredLogger for a subcategory of this StructuredLogger.
   *
   * @param subcategory the subcategory name.
   * @return a new StructuredLogger_ACC().
   */
  public function createSubcategoryLogger(subcategory : String) : StructuredLogger {
    var sublog = LoggerFactory.getLogger(this._logger.Name + "." + subcategory)
    return new StructuredLogger(sublog)
  }

  /**
   * Set logging context and evaluate an operation.
   *
   * @param blk        the operation, which evaluates to type T.
   * @param parameters a map of key/value pairs to add to the logging context.
   * @return the result of the operation.
   */
  public static function evaluateWithContext<T extends Object>(blk : block() : T, parameters : Map<String, String>) : T {
    try {
      if ((parameters != null) && !parameters.Empty) {
        parameters.eachKeyAndValue(\key, value -> MDC.put(key, value))
      }
      return blk()
    } finally {
      if ((parameters != null) && !parameters.Empty) {
        parameters.eachKey(\key -> MDC.remove(key))
      }
    }
  }

  /**
   * Add a variable to the MDC Logging context. This means the variable will be avaliable for this given thread
   * until you remove it. Remember that threads get reused by threadpools, so if you do not remove the value, it could
   * pollute a future thread with incorrect values. ALWAYS remove what you add.
   * @param variableName the name of the variable to add (null or empty key names get ignored)
   * @param variableValue the value of the variable
   */
  public static function addVariableToContext(variableName: String, variableValue : String){
    if(variableName == null || variableName.isEmpty())
      return
    MDC.put(variableName,variableValue)
  }

  /**
   * Remove a variable from the MDC Logging context. This MUST be done if you have added it.
   * @param variableName the name of the variable to remove.
   */
  public static function removeVariableFromContext(variableName: String){
    if(variableName == null || variableName.isEmpty())
      return
    MDC.remove(variableName)
  }

  /**
   * Register an obfuscation to mask PII and private data on a key name basis. This is applied
   * automatically to any data in the parameters map of LogData
   * @param obfuscationKeyName the name of the obfuscation (the key name from the parameter map)
   * @param obfuscation the obfucation class to use. Make sure this is threadsafe as it will be cached statically !
   */
  public static function registerObfuscation(obfuscationKeyName:String, obfuscation : IPIIObfuscation){
    if(obfuscationKeyName == null || obfuscationKeyName.isBlank() || obfuscation == null)
      return
    using (_obfuscationLock){
      if(REGISTERED_OBFUSCATIONS == null)
        REGISTERED_OBFUSCATIONS = Collections.synchronizedMap(new TreeMap<String, IPIIObfuscation>(String.CASE_INSENSITIVE_ORDER))
      REGISTERED_OBFUSCATIONS.put(obfuscationKeyName, obfuscation)
    }
  }

  /**
   * Obfuscate the data, if applicable.
   * @param obfuscationKeyName the name of the key, to check for a registered obfuscation
   * @param dataToObfuscate what is the data to obfuscate
   * @return return the original string if there is no obfuscation, otherwise the obfuscated value is returned
   */
  public static function obfuscate(obfuscationKeyName:String, dataToObfuscate : String, obfuscationKey : String = null) : String{
    if(obfuscationKeyName == null || dataToObfuscate == null || REGISTERED_OBFUSCATIONS ==null || !REGISTERED_OBFUSCATIONS.containsKey(obfuscationKeyName))
      return dataToObfuscate
    return REGISTERED_OBFUSCATIONS.get(obfuscationKeyName).obfuscatePII(dataToObfuscate, obfuscationKey)
  }

 /**
   * Light logging is a lightweight version of the log output intended to be used
   * only for TRACE or INFO messages where you want the very basic info and not all the extended
   * object info. This is mostly intended for use in development where you are tracing or debugging
   * statements.
   *
   * To enable light logging you add a variable to the MDC Logging context called lightLogging.
   * The variable can contain either "true" or "1" and that will cause the logging for INFO and DEBUG
   * to log only the message, userId and serverId.
   *
   * @return true if enabled, false otherwise.
   */
  public static function isLightLoggingEnabled() : boolean{
    var val = MDC.get(LIGHT_LOGGING_KEY)
    val = val == null? StructuredLoggerProperties.isLightLogging : val
    return evalBool(val)
  }

  /**
   * Should we remove CRLF from before outputting log? Default is false.
   * @return true if you want CRLF removed from log output. The default is false.
   */
  public static function isRemoveCRLF() : boolean{
    var val = MDC.get(REMOVE_CRLF_KEY) // if its not set in here then we see if its set in properties
    val = val == null? StructuredLoggerProperties.isRemoveCRLF : val
    return evalBool(val)
  }

  /**
   * Set whether we should remove carriage returns and line feeds from the logging output.
   * The default is to leave them in (false) because there is a performance impact from doing a string replace.
   * @param removeCRLF true will remove all CRLF from logging output, false will leave the strings untouched, null will force it to default to the system properties
   */
  public static function setRemoveCRLF(removeCRLF : Boolean){
    if(removeCRLF == null)
      MDC.remove(REMOVE_CRLF_KEY)
    else if(removeCRLF)
      MDC.put(REMOVE_CRLF_KEY, "1")
    else
      MDC.put(REMOVE_CRLF_KEY, "0")
  }
  /**
   * Start light logging for any info or trace level messages
   * This places a variable in the logging context to indicate the start of light logging.
   */
  public static function startLightLogging(){
    MDC.put(LIGHT_LOGGING_KEY,"1")
  }

  /**
   * Stop light logging for info and trace level messages.
   */
  public static function stopLightLogging(){
    MDC.remove(LIGHT_LOGGING_KEY)
  }

  /**
   * If we want to start timing an operation, we place a starting time into the MDC
   * This will be used by the finishTiming operation
   */
  public static function startTiming() {
    MDC.put(START_TIME_KEY,(Date.CurrentDate.getTime() as String))
    MDC.remove(TIME_MS_KEY)
  }

  /**
   * This function will complete the startTiming() call and will place
   * an entry in MDC called elapsedTimeMs that will get put in the log calls.
   * You MUST call startTiming before you call stopTiming.
   *
   * Using these calls will leave an entry in MDC. These values wont matter as they are cleaned
   * each time you call startTiming and endTiming, however they will be output to the logs erronously
   * in future threads that dont use them. Best practise is to call cleanupMDC() when you are done your
   * top most level process, which removes any known tags from the MDC
   *
   */
  public static function stopTiming(){
    var timeMs = MDC.get(START_TIME_KEY)
    if(timeMs == null)
      return // we didnt actually call startTiming()
    var timeNowMs = Date.CurrentDate.getTime()
    MDC.remove(START_TIME_KEY)
    var tMs = timeNowMs - Long.parseLong(timeMs)
    MDC.put(TIME_MS_KEY,tMs as String)
  }

  /**
   * Get the start time from when you called startTiming()
   * @return returns the time you started in Ms when you called startTiming()
   */
  public static function getStartTimeMs() : Long {
    var timeMs = MDC.get(START_TIME_KEY)
    if(timeMs == null)
      return null
    return Long.parseLong(timeMs)
  }

  /**
   * If you are using the timing operations, you can find out the elapsed time
   * so far, by calling this function. Meant to be used in combination with startTiming()
   * @return returns the elaspsed time in Ms since you started timing.
   */
  public static function getElapsedTimeMs() : Long {
    var startTimeMs = getStartTimeMs()
    if(startTimeMs == null)
      return null // we arent measuring the time, so nothing elasped
    return Date.CurrentDate.getTime() - startTimeMs
  }

  /**
   * This is a fail safe function will removes known tags from the MDC.
   * If you are using timing or placing other known tags into the MDC, this
   * function will clean it up for you. Best practise is if you are using MDC or timing
   * to call this funciton in a finally clause from the top level. It will have performance
   * implciations so call it judiciously.
   *
   * WARNING: This removes ALL known keys including traceabilityId. Its best to only call this function
   * from a top level entry point.
   *
   */
  public static function cleanupMDC(){
    MDC.remove(START_TIME_KEY)
    MDC.remove(TIME_MS_KEY)
    MDC.remove("operation")
    MDC.remove("X-B3-SpanId")
    MDC.remove("X-B3-ParentSpanId")
    MDC.remove("X-B3-TraceId")
    MDC.remove("traceabilityID")
    MDC.remove("X-B3-Sampled")
    MDC.remove("accountNumber")
    MDC.remove("claimNumber")
    MDC.remove("jobNumber")
    MDC.remove("policyNumber")
    MDC.remove("module")
    MDC.remove("tenantId")
    MDC.remove("integrationName")
    MDC.remove("vendorName")
    MDC.remove(ERROR_CODE_KEY)
  }


  /**
   * Set logging context and execute an operation.
   *
   * @param blk        the operation, which has no return value.
   * @param parameters a map of key/value pairs to add to the logging context.
   */
  public static function executeWithContext(blk : block(), parameters : Map<String, String>) {
    try {
      if ((parameters != null) && !parameters.Empty) {
        parameters.eachKeyAndValue(\key, value -> MDC.put(key, value))
      }
      blk()
    } finally {
      if ((parameters != null) && !parameters.Empty) {
        parameters.eachKey(\key -> MDC.remove(key))
      }
    }
  }

  /**
   * Log a trace message.
   *
   * @param msg        the log message.
   * @param objects    an optional list of objects, entities, or BoundPropertyReferences to add to the log message.
   * @param parameters an optional map of additional key/value pairs to add to the log message.
   * @param method     an optional reference to the method calling this log statement. There are performance implications due to reflection, so make sure you use this judiciously, as placing this in large loops can affect performance significantly.
   * @param lightLog   an optional boolean which indicates if you want to use lightLogging. Light logging only outputs the message, userId and serverId for when you are doing specific tracing or info messages, to keep the output minimal
   * @param errorCode  an optional parameter that allows you to inject a business or error code into the resulting output. This will be found in the variable contextMap and will be under the key "errorCode" in the map. The MDC will also be checked for this in case you set it in MDC.
   * @param methodClazz an optional parameter that is an alternative to passing the feature reference "Method". Using methodClazz and MethodName which are both strings will remove any performance implications in using the parameter "method". Use this in loops, batches and performance sensitive code. The downside however is that any code refactoring will have to remember to update the logging statements.
   * @param methodName  an optional parameter that is an alternative to passing the feature reference "method". Used in combination with methodClazz (see description of methodClazz)
   */
  public function trace(msg : String,
                        objects : List<Object> = null,
                        parameters : Map<String, Object> = null,
                        method : FeatureReference = null,
                        lightLog : boolean = false,
                        errorCode : String = null,
                        methodClazz : String = null,
                        methodName : String = null) : LogData{
    if (TraceEnabled) {
      var logMsg  = formatMessage(msg, objects, parameters, method, "TRACE", null, lightLog || isLightLoggingEnabled(), :errorCode = errorCode, :clazzName = methodClazz, :methodName=methodName)
      _logger.debug(formatAsString(logMsg, lightLog || isLightLoggingEnabled()))
      return logMsg
    }
    return null
  }

  /**
   * Log a debug message.
   *
   * @param msg        the log message.
   * @param objects    an optional list of objects, entities, or BoundPropertyReferences to add to the log message.
   * @param parameters an optional map of additional key/value pairs to add to the log message.
   * @param method     an optional reference to the method calling this log statement. There are performance implications due to reflection, so make sure you use this judiciously, as placing this in large loops can affect performance significantly.
   * @param lightLog   an optional boolean which indicates if you want to use lightLogging. Light logging only outputs the message, userId and serverId for when you are doing specific tracing or info messages, to keep the output minimal
   * @param errorCode  an optional parameter that allows you to inject a business or error code into the resulting output. This will be found in the variable contextMap and will be under the key "errorCode" in the map. The MDC will also be checked for this in case you set it in MDC.
   * @param methodClazz an optional parameter that is an alternative to passing the feature reference "Method". Using methodClazz and MethodName which are both strings will remove any performance implications in using the parameter "method". Use this in loops, batches and performance sensitive code. The downside however is that any code refactoring will have to remember to update the logging statements.
   * @param methodName  an optional parameter that is an alternative to passing the feature reference "method". Used in combination with methodClazz (see description of methodClazz)
   */
  public function debug(msg : String,
                        objects : List<Object> = null,
                        parameters : Map<String, Object> = null,
                        method : FeatureReference = null,
                        lightLog : boolean = false,
                        errorCode : String = null,
                        methodClazz : String = null,
                        methodName : String = null) : LogData{
    if (DebugEnabled) {
      var logMsg  = formatMessage(msg, objects, parameters, method, "DEBUG", null, lightLog || isLightLoggingEnabled(), :errorCode = errorCode, :clazzName = methodClazz, :methodName=methodName)
      _logger.debug(formatAsString(logMsg, lightLog || isLightLoggingEnabled()))
      return logMsg
    }
    return null
  }

  /**
   * Log an info message.
   *
   * @param msg         the log message.
   * @param objects     an optional list of objects, entities, or BoundPropertyReferences to add to the log message.
   * @param parameters  an optional map of additional key/value pairs to add to the log message.
   * @param method      an optional reference to the method calling this log statement. There are performance implications due to reflection, so make sure you use this judiciously, as placing this in large loops can affect performance significantly.
   * @param lightLog    an optional boolean which indicates if you want to use lightLogging. Light logging only outputs the message, userId and serverId for when you are doing specific tracing or info messages, to keep the output minimal
   * @param errorCode   an optional parameter that allows you to inject a business or error code into the resulting output. This will be found in the variable contextMap and will be under the key "errorCode" in the map. The MDC will also be checked for this in case you set it in MDC.
   * @param methodClazz an optional parameter that is an alternative to passing the feature reference "Method". Using methodClazz and MethodName which are both strings will remove any performance implications in using the parameter "method". Use this in loops, batches and performance sensitive code. The downside however is that any code refactoring will have to remember to update the logging statements.
   * @param methodName  an optional parameter that is an alternative to passing the feature reference "method". Used in combination with methodClazz (see description of methodClazz)
   */
  public function info(@NonNls msg : String,
                       objects : List<Object> = null,
                       parameters : Map<String, Object> = null,
                       method : FeatureReference = null,
                       lightLog : boolean = false,
                       errorCode : String = null,
                       methodClazz : String = null,
                       methodName : String = null) :LogData{
    if (InfoEnabled) {
      var logMsg  = formatMessage(msg, objects, parameters, method, "INFO", null, lightLog || isLightLoggingEnabled(), :errorCode = errorCode, :clazzName = methodClazz, :methodName=methodName)
      _logger.info(formatAsString(logMsg, lightLog || isLightLoggingEnabled()))
      return logMsg
    }
    return null
  }


  /**
   * Log a warn message.
   *
   * @param msg        the log message.
   * @param method     a reference to the method calling this log statement.
   * @param ex         an optional Exception.
   * @param objects    an optional list of objects, entities, or BoundPropertyReferences to add to the log message.
   * @param parameters an optional map of additional key/value pairs to add to the log message.
   * @param errorCode  an optional parameter that allows you to inject a business or error code into the resulting output. This will be found in the variable contextMap and will be under the key "errorCode" in the map. The MDC will also be checked for this in case you set it in MDC.
   * @param methodClazz an optional parameter that is an alternative to passing the feature reference "Method". Using methodClazz and MethodName which are both strings will remove any performance implications in using the parameter "method". Use this in loops, batches and performance sensitive code. The downside however is that any code refactoring will have to remember to update the logging statements.
   * @param methodName  an optional parameter that is an alternative to passing the feature reference "method". Used in combination with methodClazz (see description of methodClazz)
   */
  public function warn(msg : String,
                       method : FeatureReference,
                       ex : Exception = null,
                       objects : List<Object> = null,
                       parameters : Map<String, Object> = null,
                       errorCode : String = null,
                       methodClazz : String = null,
                       methodName : String = null) : LogData{
    if (WarnEnabled) {
      var logMsg  = formatMessage(msg, objects, parameters, method, "WARN", ex, :errorCode = errorCode, :clazzName = methodClazz, :methodName=methodName)
      _logger.warn(formatAsString(logMsg))
//      if(logMsg.isMethodEmpty()) {
//        try {
//          throw new MissingRequiredMethodParameter() // we want to highlight that you arent passing the required method parameter
//        } catch(eatenException : MissingRequiredMethodParameter){
//          //TODO: need to replace hardwired string with displayString property, this complicates the distribution so adding to future release
//          var logMsg1  = formatMessage("Missing parameter 'Method', this is mandatory for WARN logging ! Please add ASAP.", objects, parameters, #warn(String, FeatureReference, Exception, List<Object>, Map<String, Object>, String, String, String), "WARN", eatenException, :errorCode = errorCode)
//          _logger.warn(formatAsString(logMsg1))
//        }
//      }
      return logMsg
    }
    return null
  }

  /**
   * Log an error message.
   *
   * @param msg        the log message.
   * @param method     an optional reference to the method calling this log statement.
   * @param ex         an optional Exception.
   * @param objects    an optional list of objects, entities, or BoundPropertyReferences to add to the log message.
   * @param parameters an optional map of additional key/value pairs to add to the log message.
   * @param errorCode  an optional parameter that allows you to inject a business or error code into the resulting output. This will be found in the variable contextMap and will be under the key "errorCode" in the map. The MDC will also be checked for this in case you set it in MDC.
   * @param methodClazz an optional parameter that is an alternative to passing the feature reference "Method". Using methodClazz and MethodName which are both strings will remove any performance implications in using the parameter "method". Use this in loops, batches and performance sensitive code. The downside however is that any code refactoring will have to remember to update the logging statements.
   * @param methodName  an optional parameter that is an alternative to passing the feature reference "method". Used in combination with methodClazz (see description of methodClazz)
   */
  public function error(msg : String,
                        method : FeatureReference,
                        ex : Exception = null,
                        objects : List<Object> = null,
                        parameters : Map<String, Object> = null,
                        errorCode : String = null,
                        methodClazz : String = null,
                        methodName : String = null) :LogData{
    if (ErrorEnabled) {
      var logMsg  = formatMessage(msg, objects, parameters, method, "ERROR", ex, :errorCode = errorCode, :clazzName = methodClazz, :methodName=methodName)
      _logger.error(formatAsString(logMsg))
//      if(logMsg.isMethodEmpty()) {
//        try {
//          throw new MissingRequiredMethodParameter() // we want to highlight that you arent passing the required method parameter
//        } catch(eatenException : MissingRequiredMethodParameter){
//          //TODO: need to replace hardwired string with displayString property, this complicates the distribution so adding to future release
//          var logMsg1  = formatMessage("Missing parameter 'Method', this is mandatory for ERROR logging ! Please add ASAP.", objects, parameters, #error(String, FeatureReference, Exception, List<Object>, Map<String, Object>, String, String, String), "WARN", eatenException, :errorCode = errorCode)
//          _logger.warn(formatAsString(logMsg1))
//        }
//      }
      return logMsg
    }
    return null
  }

  /**
   * Format a log message string.
   *
   * @param msg        the log message.
   * @param objects    an optional list of objects, entities, or BoundPropertyReferences to add to the log message.
   * @param parameters an optional map of additional key/value pairs to add to the log message.
   * @param method     a reference to the method calling this log statement.
   * @return the formatted message string.
   */
  protected function formatMessage(msg : String,
                                   objects : List<Object> = null,
                                   parameters : Map<String, Object> = null,
                                   method : FeatureReference = null,
                                   logLevel : String = null,
                                   exception : Exception = null,
                                   lightLogging : boolean = false,
                                   errorCode : String = null,
                                   clazzName : String = null,
                                   methodName : String = null) : LogData {
    var logData = new LogData()
    if(lightLogging){
      logData.serverId = getServerId()
      logData.userId = getUserName()
      logData.message = msg
      logData.ErrorCode = errorCode == null?getMapValue(ERROR_CODE_KEY,parameters,null) as String:errorCode
      appendMethod(logData, method)
      appendMethod(logData,clazzName,methodName)
      logData.stampDate()
      parseClassAndFunctionNameFromLegacyImplementation(logData)
    }else {
      logData.setContextValuesAsMDC()
      logData.level = logLevel
      logData.threadName = getThreadName()
      logData.applicationName = getProductName()
      logData.hostName = getHostName()
      logData.serverVersion = getServerVersion()
      logData.serverId = getServerId()
      logData.serverShardId = getServerShardId()
      logData.userId = getUserName()
      logData.message = msg
      logData.ErrorCode = errorCode == null?getMapValue(ERROR_CODE_KEY,parameters,null) as String:errorCode
      logData.exceptionClass = exception==null?null : exception.Class.getName()
      logData.exceptionMessage = exception==null?null:exception.getLocalizedMessage()
      logData.stackTrace = exception==null?null:exception.StackTraceAsString
      logData.ErrorCode = errorCode == null?getMapValue(ERROR_CODE_KEY,parameters,null) as String:errorCode
      appendMethod(logData, method)
      appendMethod(logData, clazzName,methodName)
      appendObjects(logData, objects)
      appendParameters(logData, parameters)
      cleanParameters(logData)
      logData.stampDate()
      parseClassAndFunctionNameFromLegacyImplementation(logData)
    }
    return logData
  }

  protected function formatMessageAsString(msg : String,
                                           objects : List<Object> = null,
                                           parameters : Map<String, Object> = null,
                                           method : FeatureReference = null,
                                           logLevel : String = null,
                                           exception : Exception = null,
                                           lightLogging : boolean = false,
                                           errorCode : String = null) : String{
    var logData = formatMessage(msg,objects,parameters,method,logLevel,exception,lightLogging,errorCode)
    var logDataS = lightLogging?logData.toStringLight():logData.toString()
    return isRemoveCRLF()?removeCRLF(logDataS):logDataS
  }


  protected function formatAsString(logData : LogData,
                                    lightLogging : boolean = false) : String{
    var logDataS = lightLogging?logData.toStringLight():logData.toString()
    return isRemoveCRLF()?removeCRLF(logDataS):logDataS
  }


  /**
   * remove all carriage returns and line feeds from the passed in string
   * @param val the string to remove CRLF from
   * @return returns the string stripped of all CRLF
   */
  public static function removeCRLF(val : String) : String{
    if(val == null)
      return null
    return val.replace("\\r\\n"," ").replace("\\r"," ").replace("\\n"," ").replace("\\t", " ")
  }

  private function appendMethod(logData : LogData, method : FeatureReference) {
    if(method == null)
      return
    logData.setClassAndFunction(method)
  }

  private function appendMethod(logData : LogData, clazzName: String, methodName : String) {
    if((clazzName == null || clazzName.isBlank()) && (methodName == null || methodName.isBlank()))
      return
    logData.setClassAndFunction(clazzName,methodName)
  }


  private function appendObjects(logData : LogData, objects : List<Object>) {
    if (objects != null && !objects.isEmpty()) {
      for (obj in objects) {
        logData.addObject(obj, false)
      }
    }
  }

  private function appendParameters(logData : LogData, parameters : Map<String, Object>) {
    if (parameters != null)
      parameters.eachKeyAndValue(\key, value -> logData.addContextValue(key,value))
  }

  /**
   * Fix or transform any of the data in the LogData record to ensure its compliant with the standards
   * @param logData record to check and change
   */
  private function cleanParameters(logData : LogData) {
    if (logData != null && logData.contextMap != null && !logData.contextMap.isEmpty()) {
      var parameters = logData.contextMap
      var hasTrId = parameters.containsKey("traceabilityID")
      var hasxB3TrId = parameters.containsKey("X-B3-TraceId")
      //
      if(logData.ObsuicationKey == null)
        logData.ObsuicationKey = parameters.get(ENCRYPTION_KEY)
      if(!hasTrId && !hasxB3TrId) {
        var uuid = getUUID(true)
        parameters.put("traceabilityID", uuid)
        parameters.put("X-B3-TraceId", uuid.replaceAll("[-]",""))
      }else if(hasTrId && !hasxB3TrId)
        logData.addContextValue("X-B3-TraceId",parameters.get("traceabilityID").replaceAll("[-]",""))
      if(!parameters.containsKey("X-B3-Sampled"))
        logData.addContextValue("X-B3-Sampled","0") // if we havent specified in the parameter otherwise, we say "no" to sending this to zipkin for instrumentation
      if(!parameters.containsKey("X-B3-TraceId"))
        logData.addContextValue("X-B3-TraceId",getUUID(false)) // if we havent set the traceId, then we need to set it here
      parameters.remove(START_TIME_KEY) // we dont want this in the final log output
      parameters.remove(TIME_MS_KEY) // we dont want this in the final log output
      parameters.remove(LIGHT_LOGGING_KEY)
      parameters.remove(REMOVE_CRLF_KEY)
      parameters.remove(ENCRYPTION_KEY)
    }
  }


  private static function getThreadName():String {
    try{
      return Thread.currentThread().getName()
    } catch(ex:Exception){
      if(TOOLS._logger.DebugEnabled)
        TOOLS._logger.debug("Error in StructuredLogger::getThreadName()",ex)
      return null
    }

  }

  private static function getHostName() : String {
    try{
      return InetAddress.getLocalHost().getHostName()
    } catch(ex:Exception){
      if(TOOLS._logger.DebugEnabled)
        TOOLS._logger.debug("Error in StructuredLogger::getHostName()",ex)
      return null
    }

  }

  private static function getProductName() : String {
    try{
      return ServerUtil.getProduct().getProductCode()
    } catch(ex:Exception){
      if(TOOLS._logger.DebugEnabled)
        TOOLS._logger.debug("Error in StructuredLogger::getProductName()",ex)
      return null
    }

  }

  private static function getServerVersion() : String {
    try {
      var version = ServerUtil.getServerVersion()
      var json : dynamic.Dynamic
      json = new() {
        :AppVersionNum = version.getAppVersion(),
        :PlatformVersionNum = version.getPlatformVersion(),
        :SchemaVersionNum = version.getSchemaVersion(),
        :CustomerVersionNum = version.getCustomerVersion()
      }
      return removeCRLF(json.toJson())
    } catch (ex: Exception){
      if(TOOLS._logger.DebugEnabled)
        TOOLS._logger.debug("Error in StructuredLogger::getProductName()",ex)
      return null
    }
  }

  private static function getServerShardId() : String {
    try{
      return ServerUtil.getShardId()
    } catch(ex:Exception){
      if(TOOLS._logger.DebugEnabled)
        TOOLS._logger.debug("Error in StructuredLogger::getServerShardId()",ex)
      return null
    }
  }

  private static function getServerId() : String {
    try {
      return ServerUtil.getServerId()
    } catch(ex:Throwable){
      if(TOOLS._logger.DebugEnabled)
        TOOLS._logger.debug("Error in StructuredLogger::getServerId()",ex)
      return null
    }
  }

  private static function getUserName() : String {
    try{
      var user : entity.User = User.util.CurrentUser
      if(user != null)
        return user.getCredential()?.getUserName()
      return null // couldnt determine user?? -- should we use User.util.UnrestrictedUser in that case??
    } catch(ex:Exception){
      if(TOOLS._logger.DebugEnabled)
        TOOLS._logger.debug("Error in StructuredLogger::getUserName()",ex)
      return null
    }
  }

  public static function getUUID(includeDashes : boolean = true):String{
    var uuid = UUID.randomUUID().toString()
    return includeDashes?uuid:uuid.replaceAll("[-]","")
  }

  private static function evalBool(string : String) : boolean{
    if(string == null || string.equalsIgnoreCase("false") || string.equals("0") || string.isBlank())
      return false
    if(string.equalsIgnoreCase("true") || string.equals("1"))
      return true
    return false
  }

  /**
   * Helper function to populate a map with one of a few values. If the map doesnt exist it will create that as well.
   * @param key what is the key we want to put in the map
   * @param value what value do we want to put in it. if value is null there are some rules that will be followed to check defaultValue and the MDC to see where to get the value
   * @param parms what is the parms map to put it in
   * @param defaultValue what is the detaul value, if the inbound value parm is null
   * @param onlyIfEmpty if this is set to true, a check is done in the map 1st and if the key exists then we dont put the new value in (ie its already stamped in)
   * @param checkMDCForCopy when true will check the MDC to see if there is a value in there, if there is, it will use that value if the value and defaultValue are null
   * @return a copy of the map, if the map was null coming in, then it will get populated
   *
   *      Hierarchy for populating map:
   *          value
   *          MDC
   *          defaultValue
   *
   *
   */
  public static function supplementContextMap(key: String, value: Object, parms : Map<String, Object> = null,defaultValue : Object = null, onlyIfEmpty : boolean = false, checkMDCForCopy : boolean = true) : Map<String, Object>{
    if(key == null)
      return parms
    if(checkMDCForCopy && value == null)
      value = MDC.get(key)
    if(parms == null && value == null && defaultValue == null) // there is no point in creating a map if we are simply setting the value to null
      return parms
    if(parms == null || parms.isEmpty()) // we create it if it was empty in case it was just an instance of one of the empty immutable maps
      parms = new TreeMap<String, Object>(String.CASE_INSENSITIVE_ORDER)
    else if(onlyIfEmpty){ // when this is set, we will only put values into the map if they were already not value set for the key in the map
      var checkedVal = parms.get(key)
      if(checkedVal != null)
        return parms
    }
    parms.put(key, value == null ? defaultValue : value)
    return parms
  }

  public static function getMapValue(key: String, parms : Map<String, Object> = null,defaultValue : Object = null, checkMDCForCopy : boolean = true) : Object{
    if(key == null)
      return null
    var value = parms == null || parms.isEmpty()?null:parms.get(key)
    if(checkMDCForCopy && value == null)
      value = MDC.get(key)
    return (value == null ? defaultValue : value)
  }


  /**
   * Will check the logger message and return the class and function name from the string if its present in the format of className::functionName
   * Note that this will get the 1st instance of :: and parse accordingly.
   * @return null if it doesnt find any string delimited by ::, otherwise return a map of class name and function name
   */
  function parseClassAndFunctionNameFromLegacyImplementation(logData : LogData){
    if(logData == null || (logData.className != null && logData.functionName != null))
      return
    var value = logData.message
    if(value == null || value.isBlank())
      return
    final var sep = "::"
    var pos = value.indexOf(sep)
    if(pos <0)
      return
    var firstSpace = value.indexOf(" ")
    var className : String = null
    var funcName  : String = null
    if( firstSpace > pos){
      className = value.substring(0,pos)
      funcName = value.substring(pos + 2, firstSpace)
    }else {
      firstSpace = -1
      for(counter in pos - 1..0){
        // we are looking for the 1st space as a delimiter
        if(value.substring(counter, counter + 1)==" ")
          break
        firstSpace = counter
      }
      if(firstSpace>=0)
        className = value.substring(firstSpace,pos) // we will take everything up until the 1st space
      else
        className = "" // there doesnt appear to be anything for class, so it will be left as empty
      firstSpace = value.indexOf(" ",pos) // this will find the first space after ::
      if(firstSpace >=0)
        funcName = value.substring(pos + 2, firstSpace)// we take everything up until the 1st space
      else
        funcName = value.substring(pos + 2) // there wasnt a space, so we take everything after the ::
    }
    if(logData.className == null || logData.className.isBlank())
      logData.className = className
    if(logData.functionName == null || logData.functionName.isBlank())
      logData.functionName = funcName
    if(funcName != null || className != null){
      value = value.replaceAll((className==null?"":className) +sep + (funcName == null ? "" : funcName)+" ", "")
      logData.message = value.trim()
    }
  }


}