package edge.capabilities.gpa.document

uses edge.jsonrpc.IRpcHandler
uses edge.jsonrpc.annotation.JsonRpcRunAsInternalGWUser
uses edge.jsonrpc.annotation.JsonRpcMethod
uses edge.capabilities.document.dto.DocumentBaseDTO
uses org.apache.commons.fileupload.FileItem
uses gw.plugin.document.IDocumentContentSource
uses gw.plugin.Plugins
uses edge.capabilities.gpa.document.dto.DocumentDTO
uses edge.capabilities.helpers.PolicyUtil
uses edge.capabilities.helpers.JobUtil
uses edge.di.annotations.InjectableNode
uses edge.PlatformSupport.Bundle

class DocumentUploadHandler implements IRpcHandler{

  var _documentPlugin : IDocumentPlugin
  var _policyHelper : PolicyUtil
  var _jobHelper : JobUtil

  @InjectableNode
  construct(aDocumentPlugin : IDocumentPlugin, aPolicyHelper : PolicyUtil, aJobHelper : JobUtil){
    this._documentPlugin = aDocumentPlugin
    this._policyHelper = aPolicyHelper
    this._jobHelper = aJobHelper
  }

  /**
   * Uploads a document
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>IDocumentPlugin#createDocument(DocumentDTO)</code> - To create a document</dd>
   * <dd> <code>IDocumentPlugin#toDTO(Document)</code> - To return DTO with document </dd>
   * <dd> <code>IDocumentContentSource#addDocument(InputStream, Document)</code> - To add Document</dd>
   * <dt>Throws:</dt>
   *  <dd><code>IllegalArgumentException</code> - If claim number associated with the document is null or empty</dd>
   *  <dd><code>EntityNotFoundException</code> - If no claim is found</dd>
   *  <dd><code>AuthorizationException</code> - If the portal user has no access to the claim</dd>
   * </dl>
   * @param documentDTO
   * @param fileItem
   * @return document metadata response
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function upload(documentDto: DocumentDTO, documentFile: FileItem): DocumentBaseDTO {

    /** Some browsers (or fileupload library on some browsers) do not populate this field). */
    if (documentDto.MimeType == null) {
      documentDto.MimeType = documentFile.ContentType
    }

    final var doc = Bundle.resolveInTransaction( \ bundle -> {
      try {
        final var _doc = _documentPlugin.createDocument(documentDto)
        // add the document to the dms
        Plugins.get(IDocumentContentSource).addDocument(documentFile.InputStream, _doc)
        return _doc
      } finally {
        documentFile.InputStream.close()
      }
    })
    return _documentPlugin.toDTO(doc)
  }
}
