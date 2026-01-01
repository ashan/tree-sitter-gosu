package edge.servlet.jsonrpc

uses java.util.Map
uses edge.PlatformSupport.Logger
uses edge.PlatformSupport.Reflection
uses edge.security.EffectiveUser
uses javax.servlet.http.HttpServletRequest
uses javax.servlet.http.HttpServletResponse
uses edge.servlet.jsonrpc.marshalling.deserialization.dom.JsonObjectValue
uses edge.servlet.jsonrpc.protocol.JsonRpcRequest
uses java.io.Reader
uses edge.servlet.jsonrpc.marshalling.deserialization.dom.DomReader
uses java.io.BufferedReader
uses edge.servlet.jsonrpc.protocol.JsonRpcResponder
uses com.fasterxml.jackson.core.JsonParseException
uses edge.jsonrpc.exception.JsonRpcParseException
uses edge.jsonrpc.exception.ParseErrorCause
uses edge.jsonrpc.exception.JsonRpcMethodNotFoundException
uses edge.servlet.jsonrpc.marshalling.deserialization.dom.JsonValue
uses edge.servlet.jsonrpc.protocol.JsonRpcResponse
uses edge.jsonrpc.exception.JsonRpcException
uses edge.jsonrpc.exception.JsonRpcExceptionData
uses edge.jsonrpc.endpoint.IEndpointMethod
uses java.util.Collections
uses java.lang.Throwable

/**
 * Processor for regular RPC calls. A regular call is a simple POST request to a specific URL.
 */
internal final class RegularJsonRpcCallProcessor implements IRequestProcessor {

  final private static var LOGGER = new Logger(Reflection.getRelativeName(RegularJsonRpcCallProcessor))


  /** Method map for this call processor. */
  private var methods : Map<String, JsonRpcMethod>

  construct(meths : Map<String, IEndpointMethod>) {
    this.methods = meths.mapValues( \ value -> new JsonRpcMethod(value))
  }


  override function process(user : EffectiveUser, req : HttpServletRequest, resp :  HttpServletResponse) {
    final var jsonRequest = jsonRpcRequestFromReader(req.Reader)

    try{
      final var meth = methods.get(jsonRequest.Method)
      if (meth == null) {
        throw new JsonRpcMethodNotFoundException() {:Message = "Illegal method name " + jsonRequest.Method}
      }
      final var result = meth.call(user, jsonRequest.Params)
      JsonRpcResponder.setSuccessfulResponse(resp, new JsonRpcResponse(result, jsonRequest.Id))
    } catch(e : JsonRpcException) {
      LOGGER.logError(e)
      JsonRpcResponder.setErrorResponse(resp, e, jsonRequest.Id)
    } catch (t : Throwable) {
      LOGGER.logError(t)
      throw t
    }
  }


  /**
   * Parse a JSON-RPC request string
   *
   * @param jsonString The JSON-RPC 2.0 request string. Must be non null
   * @return The corresponding JSON-RPC 2.0 request object
   * @throws JsonRpcParseException If parsing fails
   */
  private static function jsonRpcRequestFromReader(final reader : Reader): JsonRpcRequest{
    var jsonObject : JsonObjectValue = null
    try{
      jsonObject = DomReader.read(new BufferedReader(reader)).asObject()
    }catch(e : JsonParseException){
      throw new JsonRpcParseException(e){
        :Message = "Invalid JSON-RPC 2.0: Issue parsing JSON payload.",
        :Data = createExceptionData(ParseErrorCause.JSON)
      }
    }
    // extract version identifier
    if(jsonObject.get("jsonrpc").isNull()){
      throw new JsonRpcParseException(){
        :Message = "Invalid JSON-RPC 2.0: JSON payload must contain jsonrpc attribute.",
        :Data = createExceptionData(ParseErrorCause.PROTOCOL)
      }
    }

    if (jsonObject.get("jsonrpc").asString() != "2.0") {
      throw new JsonRpcParseException(){
        :Message = "Invalid JSON-RPC 2.0: jsonrpc version must be \"2.0\".",
        :Data = createExceptionData(ParseErrorCause.JSON)
      }
    }

    // extract method name
    if(jsonObject.get("method").isNull()){
      throw new JsonRpcParseException(){
        :Message = "Invalid JSON-RPC 2.0: JSON payload must contain method attribute",
        :Data = createExceptionData(ParseErrorCause.PROTOCOL)
      }
    }

    var method = jsonObject.get("method").asString()

    var id = jsonObject.get("id").asNativeValue()
    if(id != null && !(id typeis Number) && !(id typeis Boolean) && !(id typeis String)){
      throw new JsonRpcParseException(){
        :Message = "Invalid JSON-RPC 2.0: Identifier not a JSON scalar",
        :Data = createExceptionData(ParseErrorCause.JSON)
      }
    }

    // extract params
    var paramField = jsonObject.get("params")
    var params = paramField.isNull() ? Collections.emptyList<JsonValue>(): paramField.asArray().asListOfJsonValues()
    return new JsonRpcRequest(method, params, id)
  }


  private static function createExceptionData(error: ParseErrorCause, jsonString: String): JsonRpcExceptionData{
    return JsonRpcExceptionData.newExceptionData({
        "parse error" -> error,
        "unparsable string" -> jsonString
    })
  }

  private static function createExceptionData(error: ParseErrorCause): JsonRpcExceptionData{
    return JsonRpcExceptionData.newExceptionData({
        "parse error" -> error,
        "unparsable string" ->""
    })
  }
}
