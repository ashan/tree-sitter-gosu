package edge.devtools

uses gw.servlet.Servlet
uses javax.servlet.http.HttpServlet
uses javax.servlet.http.HttpServletRequest
uses javax.servlet.http.HttpServletResponse
uses edge.servlet.HandlerInfoLookup
uses java.lang.Throwable

/**
 * Servlet for reloading edge JsonRpcServlets (and other edge configuration data).
 */
@Servlet("/edge-dev/handler-status")
class JsonRpcStatusServlet extends HttpServlet {
  override function doGet(req : HttpServletRequest, resp : HttpServletResponse) {
    resp.setCharacterEncoding("UTF-8")
    resp.setContentType("text/plain")
    CacheHeaderUtil.setNoCache(resp)

    final var status = HandlerInfoLookup.Status

    if (status.isLeft) {
      resp.Writer.println("CONFIGURATION ERRORS FOUND")
      status.left.each( \ elt -> resp.Writer.println(elt))
    } else {
      resp.Writer.println("OK")
      resp.Writer.println("Document handlers: " + status.right.DocumentHandlerCount)
      resp.Writer.println("JsonRpc handlers: " + status.right.JsonRpcHandlerCount)
    }
  }
}
