package edge.servlet.jsonrpc

uses javax.servlet.http.HttpServletRequest
uses edge.security.EffectiveUser
uses javax.servlet.http.HttpServletResponse

/**
 * Http request processor. It knows how to handle (process or route) incoming requests.
 */
interface IRequestProcessor {
  /** Processes a request. "Processing" mean that response should be filled by the handler. It could be done by the
   * handler itself or by delegating some work to some other handler.
   */
  function process(user : EffectiveUser, req : HttpServletRequest, resp :  HttpServletResponse)
}
