package edge.capabilities.policy.document

uses org.apache.commons.fileupload.FileItem
uses edge.di.annotations.InjectableNode
uses gw.api.webservice.exception.BadIdentifierException
uses edge.capabilities.policy.auth.IPolicyAccessPlugin
uses edge.security.authorization.exception.NoAuthorityException
uses edge.capabilities.policy.document.dto.PolicyDocumentDTO
uses gw.plugin.Plugins
uses gw.plugin.document.IDocumentContentSource
uses edge.capabilities.policy.document.dto.PolicyDocumentUploadDTO
uses edge.capabilities.policy.document.IPolicyDocumentsPlugin
uses edge.PlatformSupport.Bundle
uses edge.capabilities.document.IDocumentSessionPlugin
uses edge.security.authorization.exception.AuthorizationException
uses edge.jsonrpc.annotation.JsonRpcMethod
uses edge.capabilities.policy.util.PolicyUtil
uses edge.jsonrpc.IRpcHandler
uses edge.security.fileupload.exception.IllegalContentTypeException
uses edge.security.fileupload.IFileUploadPlugin

/**
 * Handler of document uploads.
 * It is needed to work around "security through obscurity" in the authz service and its inability
 * to cope with many different access modes for the same URL. It is also work around for a third-party component
 * which is also inflexible and could not accommodate (use) different transports.
 */
class PolicyDocumentUploadHandler implements IRpcHandler {
  private var _policyAuthCheck : IPolicyAccessPlugin
  private var _documentPlugin : IPolicyDocumentsPlugin
  private var _documentSessionPlugin : IDocumentSessionPlugin
  private var _fileUploadPlugin : IFileUploadPlugin

  @InjectableNode
  @Param("policyAuthCheck", "Policy access policy")
  @Param("documentPlugin", "Plugin used to access documents associated with the policy")
  @Param("documentSessionPlugin", "Document session management plugin")
  construct(policyAuthCheck : IPolicyAccessPlugin, documentPlugin : IPolicyDocumentsPlugin,
            documentSessionPlugin : IDocumentSessionPlugin, fileUploadPlugin : IFileUploadPlugin) {
    this._policyAuthCheck = policyAuthCheck
    this._documentPlugin = documentPlugin
    this._documentSessionPlugin = documentSessionPlugin
    this._fileUploadPlugin = fileUploadPlugin
  }


  @JsonRpcMethod
  function upload(documentDto:PolicyDocumentUploadDTO, documentFile: FileItem) : PolicyDocumentDTO {
    try {
      if (!_documentSessionPlugin.isSessionValid(documentDto.SessionID)) {
        throw new AuthorizationException(){:Message = "Unauthorized portal access"}
      }

      if (!_fileUploadPlugin.canUploadContentType(documentFile.ContentType)) {
        throw new IllegalContentTypeException("Cannot upload files of content type: " + documentFile.ContentType)
      }

      var policyPeriod = PolicyUtil.getLatestPolicyPeriodByPolicyNumber(documentDto.PolicyNumber)

      if (policyPeriod == null) {
        throw new BadIdentifierException("Can not find currently active policy period for " + documentDto.PolicyNumber)
      }

      if (!_policyAuthCheck.hasAccess(policyPeriod)) {
        throw new NoAuthorityException()
      }


      final var res = Bundle.resolveInTransaction<Document>(\ bundle -> {
        policyPeriod = bundle.add(policyPeriod)
        final var doc = _documentPlugin.createDocumentMetadata(policyPeriod, documentDto)
        Plugins.get(IDocumentContentSource).addDocument(documentFile.InputStream, doc)
        return doc
      })

      /* Should do this outside the transactions as public ID is not set inside the bundle. */
      return _documentPlugin.getDocumentDetails(res)
    } finally {
      documentFile.InputStream.close()
    }
  }
}
