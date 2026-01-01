package edge.servlet

uses edge.servlet.security.IHttpRequestUserIdentityPlugin
uses javax.servlet.http.HttpServletResponse
uses javax.servlet.http.HttpServletRequest
uses edge.capabilities.document.IDocumentRetrievalHandler
uses edge.security.EffectiveUserProvider

/**
 * Processor for document download URLs.
 */
internal final class DocumentDownloadEndpointProcessor {
  private var _authorizer : IHttpRequestUserIdentityPlugin
  private var _peer : IDocumentRetrievalHandler


  construct(authorizer : IHttpRequestUserIdentityPlugin, peer : IDocumentRetrievalHandler) {
    this._authorizer = authorizer
    this._peer = peer
  }


  internal function doGet(req : HttpServletRequest, resp : HttpServletResponse) {
    var effectiveUser = _authorizer.getEffectiveUserFromRequest(req)
    EffectiveUserProvider.User = effectiveUser
    _peer.doGet(req, resp)
  }
}
