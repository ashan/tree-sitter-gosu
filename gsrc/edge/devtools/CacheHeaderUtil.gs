package edge.devtools
uses javax.servlet.http.HttpServletResponse

/** Utilities to set caching headers. */
internal final class CacheHeaderUtil {
  private construct() {
  }
  
  
  /** 
   * Adds headers preventing caching of servlet responces.
   * @param resp response to set headers on.
   */
  public static function setNoCache(resp : HttpServletResponse) {
    resp.setHeader("Cache-Control", "no-cache, no-store, must-revalidate")
    resp.setHeader("Pragma", "no-cache")
    resp.setHeader("Expires", "0")
  }

}
