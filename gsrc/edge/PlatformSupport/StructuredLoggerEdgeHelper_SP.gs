package edge.PlatformSupport

uses edge.jackson.jsonrpc.support.JsonRpcRequest
uses edge.security.EffectiveUser
uses org.apache.logging.log4j.ThreadContext

public final class StructuredLoggerEdgeHelper_SP {

  private static final var JSON_RPC_ID = "JsonRpcId"
  private static final var REQ_PATH = "requestPath"
  private static final var JSON_RPC_METHOD = "methodName"
  private static final var EFF_USER = "effectiveUser"
  private static final var ACC_NUMBER = "accountNumber"
  private static final var JOB_NUMBER = "jobNumber"
  private static final var POL_NUMBER = "policyNumber"
  private static final var _EDGE_LOGGER = new Logger(StructuredLoggerEdgeHelper_SP.RelativeName)

  /**
   * common structures to examine edge payloads
   */
  structure QuoteIdDTO {
    property get QuoteID() : String
  }

  structure JobNumberDTO {
    property get JobNumber() : String
  }

  structure PolicyNumberDTO {
    property get PolicyNumber() : String
  }

  structure AccountNumberDTO {
    property get AccountNumber() : String
  }

  private static final var _PARAMETERS = new ThreadLocal<Map<String, String>>()

  /**
   * use this property if you are going to add a parameter to the parameter map.
   *
   * @return - the initialized parameter map.
   */
  protected static property get EDGE_LOGGER_PARAMETERS() : Map<String, String> {
    if (_PARAMETERS.get() == null) {
      EDGE_LOGGER_PARAMETERS = new TreeMap<String, String>() // use a treemap so the order is consistent
      _EDGE_LOGGER.logDebug("Creating parameters")
    }
    return _PARAMETERS.get()
  }

  protected static function mergeNewParameters(newParams : Map<String, Object>) : Map<String, Object> {
    if (newParams == null or newParams.Count == 0) {
      return EDGE_LOGGER_PARAMETERS
    }
    // use a treemap so the parameter order is consistent
    var allParams = new TreeMap<String, Object>()
    EDGE_LOGGER_PARAMETERS.keySet().each(\key -> allParams.put(key as String, EDGE_LOGGER_PARAMETERS.get(key)))
    if (newParams != null) {
      newParams.keySet().each(\key -> allParams.put(key as String, newParams.get(key)))
    }
    return allParams
  }

  /**
   * assign an existing parameter map to the thread.
   *
   * @param val - the new parameter map
   */
  private static property set EDGE_LOGGER_PARAMETERS(val : Map<String, String>) {
    if (val == null) {
      _EDGE_LOGGER.logDebug("Removing parameters")
      _PARAMETERS.remove()
    } else {
      _PARAMETERS.set(val)
      _EDGE_LOGGER.logDebug("Setting parameters")
    }
  }

  /**
   * prevent instantiation
   */
  private construct() {
  }

  /**
   * add the effective user to the edge logging parameter map
   *
   * @param effUser
   */
  public static function configureEffectiveUser(effUser : EffectiveUser) {
    if (effUser != null) {
      EDGE_LOGGER_PARAMETERS.put(EFF_USER, effUser.Username)
      _EDGE_LOGGER.logDebug("Setting effective user")
    }
  }

  /**
   * remove the effective user from the edge logging parameter map
   */
  public static function clearEffectiveUser() {
    if (_PARAMETERS.get() != null) {
      _EDGE_LOGGER.logDebug("Clearing effective user")
      EDGE_LOGGER_PARAMETERS.put(EFF_USER, null)
    }
  }

  /**
   * save the edge calling path to the list of edge logging logging parameters
   *
   * @param path - path value to add to the edge logging parameter map
   */
  public static function configureHttpRequestPath(path : String) {
    if (path != null) {
      EDGE_LOGGER_PARAMETERS.put(REQ_PATH, path)
      _EDGE_LOGGER.logDebug("Setting request path")
    }
  }

  /**
   * remove the edge calling path from the edge logging parameter map
   */
  public static function clearHttpRequestPath() {
    if (_PARAMETERS.get() != null) {
      _EDGE_LOGGER.logDebug("Clearing request path")
      EDGE_LOGGER_PARAMETERS.put(REQ_PATH, null)
    }
  }

  /**
   * add the json rpc request parameters (method and request parameters)
   * to the edge logging parameter map
   *
   * @param request - json rpc request to add to the logging parameters
   */
  public static function configureJsonRpcRequest(request : JsonRpcRequest) {
    if (request != null) {
      if (request.Id != null) {
        // excluding JSON_RPC_ID from parameters, leave in Edge MDC
        ThreadContext.put(JSON_RPC_ID, request.Id.toString())
        _EDGE_LOGGER.logDebug("Setting request id ${request.Id.toString()}")
      }
      if (request.Method != null) {
        EDGE_LOGGER_PARAMETERS.put(JSON_RPC_METHOD, request.Method)
        _EDGE_LOGGER.logDebug("Setting Edge method being called")
      }
      configureJsonRpcRequestParams(request.Params)
    }
  }

  /**
   * remove the json rpc data from the edge logging parameter map
   */
  public static function clearJsonRpcRequest() {
    if (_PARAMETERS.get() != null) {
      _EDGE_LOGGER.logDebug("Clearing request id ${ThreadContext.get(JSON_RPC_ID)}")
      ThreadContext.remove(JSON_RPC_ID)
      _EDGE_LOGGER.logDebug("Clearing Edge method being called")
      EDGE_LOGGER_PARAMETERS.put(JSON_RPC_METHOD, null)
    }
    // we should not need any parameters after this point
    EDGE_LOGGER_PARAMETERS = null
  }

  /**
   * configureJsonRpcRequestParams identifies parameters in the json-rpc request by using Gosu structures
   *
   * @param params
   */
  public static function configureJsonRpcRequestParams(params : List<Object>) {
    for (var parameter in params) {
      if (parameter typeis AccountNumberDTO) {
        if (parameter.AccountNumber != null) {
          EDGE_LOGGER_PARAMETERS.put(ACC_NUMBER, parameter.AccountNumber)
          _EDGE_LOGGER.logDebug("Setting account number")
        }
      }
      if (parameter typeis QuoteIdDTO) {
        if (parameter.QuoteID != null) {
          EDGE_LOGGER_PARAMETERS.put(JOB_NUMBER, parameter.QuoteID)
          _EDGE_LOGGER.logDebug("Setting job number (quoteid)")
        }
      }
      if (parameter typeis JobNumberDTO) {
        if (parameter.JobNumber != null) {
          EDGE_LOGGER_PARAMETERS.put(JOB_NUMBER, parameter.JobNumber)
          _EDGE_LOGGER.logDebug("Setting job number")
        }
      }
      if (parameter typeis PolicyNumberDTO) {
        if (parameter.PolicyNumber != null) {
          EDGE_LOGGER_PARAMETERS.put(POL_NUMBER, parameter.PolicyNumber)
          _EDGE_LOGGER.logDebug("Setting policy number")
        }
      }
    }
  }
}