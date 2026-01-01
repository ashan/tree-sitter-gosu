package edge.servlet

uses javax.servlet.http.HttpServletRequest

/** Miscellaneous utilities for Edge servlets. */
internal final class EdgeServletUtil {
  internal static function retrieveRequestLocale(req: HttpServletRequest) : String {
    var lang = req.getHeader("Accept-Language")
    if ( lang != null )  {
      lang = lang.replace("-","_")
    }
    return lang
  }
}
