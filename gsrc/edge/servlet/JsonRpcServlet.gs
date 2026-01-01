package edge.servlet

uses javax.servlet.http.HttpServletResponse
uses javax.servlet.http.HttpServletRequest
uses gw.servlet.Servlet
uses edge.PlatformSupport.Logger
uses edge.PlatformSupport.Reflection
uses edge.PlatformSupport.Locale
uses edge.servlet.jsonrpc.protocol.JsonRpcResponder
uses edge.jsonrpc.exception.JsonRpcInvalidParamsException
uses edge.util.mapping.EntityCreationContextProvider
uses gw.servlet.AbstractBasicAuthenticationServlet

@Servlet(\ path : String -> path.matches("/edge/(?!document(/.*)?)(.*)")) // /edge/document is used for retrieving documents
class JsonRpcServlet extends AbstractBasicAuthenticationServlet {
  
  final private static var LOGGER = new Logger(Reflection.getRelativeName(JsonRpcServlet))

  final override function isAuthenticationRequired(req : HttpServletRequest) : boolean {
    return true
  }
  
  /**
   *  Handles the POST calls to the servlet
   *
   * @param req The HttpServletRequest object
   * @param resp The HttpServletResposne object
   */
  override function doPost(req: HttpServletRequest, resp: HttpServletResponse){
    req.CharacterEncoding = "UTF-8"
    resp.CharacterEncoding = "UTF-8"

    Locale.runWithLocale(EdgeServletUtil.retrieveRequestLocale(req), \ -> {
      try{
        final var handler = HandlerInfoLookup.Instance.JsonRpcProcessors.get(req.PathInfo)
        if (handler != null) {
          handler.handleCall(req, resp)
          return
        }

        final var e = new JsonRpcInvalidParamsException(){:Message = "No matching handler found for path :" + req.PathInfo}
        LOGGER.logError(e)

        JsonRpcResponder.setErrorResponse(resp, e, "1")
      } finally {
        EntityCreationContextProvider.clear()
        logout(req)
      }
    })

    LOGGER.logDebug("#doPost(HttpServletRequest,HttpServletResponse) - Exiting")
  }
}
