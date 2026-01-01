package edge.capabilities.document

uses edge.jsonrpc.exception.JsonRpcSecurityException
uses gw.document.DocumentContentsInfo
uses gw.plugin.document.IDocumentContentSource
uses edge.di.annotations.ForAllGwNodes
uses edge.capabilities.document.exception.DocumentRetrievalException
uses edge.capabilities.document.exception.DocumentErrorCode
uses edge.security.authorization.Authorizer
uses edge.security.authorization.exception.NoAuthorityException
uses edge.security.authorization.IAuthorizerProviderPlugin

class DefaultDocumentContentPlugin implements IDocumentContentPlugin {

  private var _documentAuthorizer : Authorizer<Document>

  @ForAllGwNodes
  construct(authorizerProvider: IAuthorizerProviderPlugin ){
    this._documentAuthorizer = authorizerProvider.authorizerFor(Document)
  }

  override function getDocumentContents(doc : Document) : DocumentContentsInfo {
    if (!_documentAuthorizer.canAccess(doc)) {
      //throw new NoAuthorityException()
      throw new JsonRpcSecurityException(){: Message = "Document doesn't belongs to this account or invalid document public id has been provided"}
    }
    var docContentPlugin = gw.plugin.Plugins.get(IDocumentContentSource)
    if (!docContentPlugin.OutboundAvailable) {
      throw new DocumentRetrievalException(DocumentErrorCode.CMS_TEMPORARLY_UNAVAILABLE, "The document is temporarily unavailable")
    }
    if (!docContentPlugin.isDocument(doc)) {
      throw new DocumentRetrievalException(DocumentErrorCode.DOCUMENT_NOT_IN_CMS,
          "The document with public ID ${doc.PublicID} has no associated content or it has been removed from the CMS.")
    }

    return docContentPlugin.getDocumentContentsInfo(doc, true)
  }

}
