package edge.servlet

uses javax.servlet.http.HttpServletResponse
uses javax.servlet.http.HttpServletRequest
uses gw.servlet.Servlet
uses edge.PlatformSupport.Logger
uses edge.PlatformSupport.Reflection
uses edge.PlatformSupport.Locale
uses gw.servlet.AbstractBasicAuthenticationServlet

@Servlet(\ path : String -> path.matches("/edge/document(/.*)?"))
class DocumentDownloadServlet extends AbstractBasicAuthenticationServlet {

  final private static var LOGGER = new Logger(Reflection.getRelativeName(DocumentDownloadServlet))

  override function doGet(req: HttpServletRequest, resp: HttpServletResponse) {
    Locale.runWithLocale(EdgeServletUtil.retrieveRequestLocale(req), \ -> {
      final var capSlash = req.PathInfo.indexOf("/", HandlerInfoLookup.DOC_PATH_PREFIX.length())
      if (capSlash < 0) {
        resp.sendError(404)
        return
      }
      final var hSlash = req.PathInfo.indexOf("/",  capSlash + 1)
      if (hSlash < 0) {
        resp.sendError(404)
        return
      }
      final var path = req.PathInfo.substring(0, hSlash)
      final var handler = HandlerInfoLookup.Instance.DocumentDownloadProcessors.get(path)
      if (handler == null) {
        resp.sendError(404)
      } else {
        handler.doGet(req, resp)
      }
    })
  }

  override function isAuthenticationRequired(req : HttpServletRequest) : boolean {
    return true
  }
}
