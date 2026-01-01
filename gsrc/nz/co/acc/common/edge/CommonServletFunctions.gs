package nz.co.acc.common.edge

uses edge.jsonrpc.exception.JsonRpcParseException
uses edge.servlet.jsonrpc.marshalling.deserialization.dom.DomReader
uses edge.servlet.jsonrpc.protocol.JsonRpcResponder
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.edge.security.BCSSUserProvider_ACC
uses nz.co.acc.common.edge.security.permission.BCSSUser_ACC
uses nz.co.acc.common.edge.servlet.HttpServletRequestWrapper_ACC
uses org.apache.commons.io.IOUtils
uses org.slf4j.LoggerFactory

uses javax.servlet.http.HttpServletRequest
uses javax.servlet.http.HttpServletResponse

/**
 * Created by KasthuA on 7/06/2017.
 */
class CommonServletFunctions {
  public static final var REQUEST : String = "request"
  public static final var RESPONSE : String = "response"
  public static final var CORRELATION_ID : String = "correlationId"
  public static final var BCSS_REQUESTER : String = "requester"
  public static final var EDGE_METHOD : String = "method"
  public static final var EDGE_PARAMS : String = "params"
  public static final var HTTP_POST : String = "POST"
  private var _edgeLogger = StructuredLogger.EDGE_SP.withClass(CommonServletFunctions)

  function handlePreService(params : Map) : Map {
    // Get the correlation id and set it in the response straight away
    var req = (params.get(REQUEST) as HttpServletRequest)
    var correlationId = req.getHeader(CORRELATION_ID)
    params.put(CORRELATION_ID, correlationId)
    (params.get(RESPONSE) as HttpServletResponse).addHeader(CORRELATION_ID, correlationId)

    // If it's a POST request wrap the request, so we can use the Reader multiple types
    var accRequest = req
    if (req.Method == HTTP_POST) {
      accRequest = new HttpServletRequestWrapper_ACC(req)
      params.put(REQUEST, accRequest)
    }

    // Set the BCSSUser in the thread, so we can access the information inside the handlers if required
    var bcssUser : BCSSUser_ACC = BCSSUser_ACC.getInstance(accRequest.getHeader(BCSS_REQUESTER))
    BCSSUserProvider_ACC.setBCSSUser(bcssUser)
    params.put(BCSS_REQUESTER, bcssUser)

    // Log the request
    logRequest(accRequest, params.get(RESPONSE) as HttpServletResponse, correlationId, bcssUser)

    return params
  }

  function handlePostService(params : Map) {
    logResponse(params.get(CORRELATION_ID), params.get(BCSS_REQUESTER) as BCSSUser_ACC)
  }

  private function logRequest(req : HttpServletRequest, resp : HttpServletResponse, correlationId : Object, bcssUser : BCSSUser_ACC) {
    var method : String = ''
    var params : String = ''
    var payload : String
    if (req.Method == HTTP_POST) {
      try {
        payload = IOUtils.toString(req.getReader())
        var reader = DomReader.read(req.Reader).asObject()
        method = "|Method:${reader.get(EDGE_METHOD).asNativeValue().toString()}|"
        params = "|Params: ${reader.get(EDGE_PARAMS).asNativeValue().toString()}"
      } catch (e : Exception) {
        final var je = new JsonRpcParseException() {:Message = "Invalid JSON Payload.."}
        JsonRpcResponder.setErrorResponse(resp, je, "1")
        throw new JsonRpcParseException() {:Message = "# Invalid JSON Payload # | " + payload}
      } finally {
        _edgeLogger.info("|REQUEST -> |Correlation ID:${correlationId}|BCSSUserID:${BCSSUserProvider_ACC.getBCSSSUser().BcssId}|Host:${req.RemoteHost}|URI:${req.RequestURI}${method}")
      }
    }
  }

  private function logResponse(correlationId : Object, bcssUser : BCSSUser_ACC) {
    _edgeLogger.info("|RESPONSE -> |correlation ID:${correlationId}|BCSSUserID:${bcssUser.BcssId}")
  }
}
