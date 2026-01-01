package edge.servlet.jsonrpc.protocol

uses edge.PlatformSupport.Logger
uses edge.PlatformSupport.Reflection
uses edge.jsonrpc.exception.JsonRpcException
uses edge.jsonrpc.exception.JsonRpcErrorCode
uses java.io.IOException
uses edge.jsonrpc.exception.JsonRpcInternalErrorException
uses javax.servlet.http.HttpServletResponse
uses edge.servlet.jsonrpc.marshalling.serialization.SerializerFactory
uses java.io.BufferedWriter
uses com.fasterxml.jackson.core.JsonFactory


/**
 * Responder for the JsonRpc methods. Know how to set json-rpc response or error.
 */
final class JsonRpcResponder {

  final private static var LOGGER = new Logger(Reflection.getRelativeName(JsonRpcResponder))

  /** Serializer for error responses. */
  private static final var SERIALIZER = SerializerFactory.DEFAULT_FACTORY.getSerializerForDeclaredType(JsonRpcResponse)


  static function setSuccessfulResponse(final resp: HttpServletResponse, final response: JsonRpcResponse){
    respond(resp, response)
  }

  static function setErrorResponse(final resp: HttpServletResponse, final error: JsonRpcException, final jsonRpcRequestId: Object){
    var errorCode = getHttpHeaderResponseErrorCode(error)
    resp.setStatus(errorCode)
    respond(resp, new JsonRpcResponse(error, jsonRpcRequestId))
  }

  /**
   * Maps the json rpc exceptions to a http header response code
   *
   * @param e JsonRpcException Exception that has been thrown while processing the request
   * @return The http header response code
   */
  private static function getHttpHeaderResponseErrorCode(e : JsonRpcException) : int{
    switch(e.JsonRpcError){
      case JsonRpcErrorCode.INVALID_PARAMS:
      case JsonRpcErrorCode.PARSE_ERROR:
          return HttpServletResponse.SC_BAD_REQUEST
      case JsonRpcErrorCode.INTERNAL_ERROR:
      case JsonRpcErrorCode.APPLICATION_ERROR:
      case JsonRpcErrorCode.SYSTEM_ERROR:
      case JsonRpcErrorCode.TRANSPORT_ERROR:
          return HttpServletResponse.SC_INTERNAL_SERVER_ERROR
      case JsonRpcErrorCode.INVALID_REQUEST:
      case JsonRpcErrorCode.METHOD_NOT_FOUND:
          return HttpServletResponse.SC_NOT_IMPLEMENTED
        default:
        return HttpServletResponse.SC_BAD_REQUEST
    }
  }

  /**
   * Sends a response to the cilent application.
   */
  private static function respond(resp : HttpServletResponse, r : JsonRpcResponse) {
    try {
      resp.setContentType("application/json")
      resp.setCharacterEncoding("UTF-8")

      final var writer = new BufferedWriter(resp.Writer)
      final var generator = new JsonFactory().createJsonGenerator(writer)
      try {
        SERIALIZER.writeValue(generator, r)
      } finally {
        generator.flush()
        writer.flush()
      }
    } catch(e : IOException) {
      throw new JsonRpcInternalErrorException(e){
          :Message = "Exception occurred while trying to write response"
      }
    }
  }
}
