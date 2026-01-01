package edge.capabilities.policy.document

uses edge.capabilities.document.IDocumentSessionPlugin
uses edge.capabilities.document.util.DocumentUtil
uses edge.di.annotations.InjectableNode
uses edge.jsonrpc.IRpcHandler
uses edge.jsonrpc.annotation.JsonRpcMethod
uses edge.capabilities.policy.document.IPolicyDocumentsPlugin

/**
 * Handler for the policy-related document upload. This handler belongs to policy package as
 * it have access to both policy and policy-document related functionality.
 */
class PolicyDocumentHandler implements IRpcHandler {
  
  private var _documentPlugin : IPolicyDocumentsPlugin
  private var _documentSessionPlugin : IDocumentSessionPlugin

  @InjectableNode
  @Param("documentPlugin", "Plugin used to access documents associated with the policy")
  @Param("documentSessionPlugin", "Document session management plugin")
  construct(documentPlugin : IPolicyDocumentsPlugin, documentSessionPlugin : IDocumentSessionPlugin) {
    this._documentPlugin = documentPlugin
    this._documentSessionPlugin = documentSessionPlugin
  }


  @JsonRpcMethod
  public function removeDocument(publicID: String) : Boolean {
    final var doc = DocumentUtil.getDocumentByPublicId(publicID)
    _documentPlugin.deleteDocument(doc)
    return true
  }


  
  @JsonRpcMethod
  public function generateUploadToken() : String {
    return _documentSessionPlugin.getDocumentSession()
  }

}
