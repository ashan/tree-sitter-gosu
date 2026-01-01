package edge.capabilities.gpa.document

uses edge.jsonrpc.IRpcHandler
uses edge.capabilities.document.util.DocumentUtil
uses edge.jsonrpc.annotation.JsonRpcMethod
uses edge.di.annotations.InjectableNode
uses edge.capabilities.document.IDocumentSessionPlugin
uses edge.capabilities.gpa.document.IDocumentPlugin
uses edge.jsonrpc.annotation.JsonRpcRunAsInternalGWUser

class DocumentHandler implements IRpcHandler {

  var _documentPlugin : IDocumentPlugin
  var _documentSessionPlugin : IDocumentSessionPlugin

  @InjectableNode
  @Param("sessionPlugin", "Document session management plugin")
  @Param("documentPlugin", "Plugin used to access documents associated with the policy")
  construct(sessionProvider : IDocumentSessionPlugin, documentPlugin : IDocumentPlugin){
    this._documentSessionPlugin = sessionProvider
    this._documentPlugin = documentPlugin
  }

  /**
   * Removes a document given its Public ID
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>DocumentUtil#getDocumentByPublicId(java.lang.String)</code> - To retrieve a document given its Public ID</dd>
   * <dd> <code>IDocumentPlugin#removeDocument(Document)</code> - To remove Document</dd>
   * </dl>
   * @param   publicID  The ID of the document to remove
   */
  @JsonRpcMethod
  @JsonRpcRunAsInternalGWUser
  public function removeDocument(publicID: String) : Boolean {
    final var doc = DocumentUtil.getDocumentByPublicId(publicID)
    _documentPlugin.removeDocument(doc)

    return true
  }

  /**
   * Generate a token used to verify document upload is allowed.
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>IDocumentSessionPlugin#getDocumentSession()</code> - To generate a session token</dd>
   * </dl>
   * @return A String document session token
   */
  @JsonRpcMethod
  @JsonRpcRunAsInternalGWUser
  public function generateUploadToken() : String {
    return _documentSessionPlugin.getDocumentSession()
  }
}
