package edge.capabilities.document

uses javax.servlet.http.HttpServletRequest
uses javax.servlet.http.HttpServletResponse

/**
 * Base interface for all retrieval handlers.s
 */
interface  IDocumentRetrievalHandler {
  /**
   * Handles document request.
   */
  function doGet(req : HttpServletRequest, resp : HttpServletResponse)
}
