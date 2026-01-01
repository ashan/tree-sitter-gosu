package nz.co.acc.edge.capabilities.document

uses edge.PlatformSupport.Logger
uses edge.capabilities.document.DocumentRetrievalHandler
uses edge.capabilities.document.IDocumentContentPlugin
uses edge.capabilities.document.IDocumentSessionPlugin
uses edge.di.annotations.InjectableNode
uses edge.jsonrpc.exception.JsonRpcInvalidParamsException
uses edge.jsonrpc.exception.JsonRpcInvalidRequestException
uses edge.jsonrpc.exception.JsonRpcSecurityException
uses edge.security.authorization.exception.AuthorizationException
uses edge.servlet.jsonrpc.protocol.JsonRpcResponder
uses gw.document.DocumentContentsInfo
uses nz.co.acc.edge.capabilities.document.util.DocumentUtil_ACC

uses javax.servlet.ServletException
uses javax.servlet.http.HttpServletRequest
uses javax.servlet.http.HttpServletResponse
uses java.io.ByteArrayOutputStream
uses java.io.InputStream
uses java.io.OutputStream

/**
 * Created by stzhang on 10/26/2017.
 */
class DocumentRetrievalHandler_ACC extends DocumentRetrievalHandler {

  private static final var TRANSFER_BUFFER_SIZE : int = 4096 //Size of the buffer used to send the document data back to the client
  private static final var LOGGER = new Logger(DocumentRetrievalHandler_ACC.Type.QName)
  private var _sessionPlugin : IDocumentSessionPlugin
  private var _contentPlugin : IDocumentContentPlugin

  @InjectableNode
  @Param("sessionPlugin", "Document session management plugin")
  @Param("contentPlugin", "Plugin to retrieve document contents from DMS")
  construct(sessionPlugin : IDocumentSessionPlugin, contentPlugin : IDocumentContentPlugin) {
    super(sessionPlugin,contentPlugin)
    this._sessionPlugin = sessionPlugin
    this._contentPlugin = contentPlugin
  }

  function doGet(req : HttpServletRequest, resp : HttpServletResponse) {
    try {
      LOGGER.logDebug("Processing document")
      if (!_sessionPlugin.isSessionValid(req.getParameter("token"))) {
        throw new JsonRpcSecurityException(){: Message = "Invalid Document Public ID"}
      }

      var docID = retrieveDocumentID(req)
      LOGGER.logDebug("Processing document id " + docID)

      var doc = DocumentUtil_ACC.getDocumentByPublicId(docID)
      var docContent = _contentPlugin.getDocumentContents(doc)
      try {
        switch(docContent.ResponseType) {
          case DocumentContentsInfo.ContentResponseType.DOCUMENT_CONTENTS:
            resp.setContentType(docContent.ResponseMimeType)
            resp.setHeader("Content-Disposition", "attachment; filename=" + doc.Name)
            copyStream(docContent.InputStream, resp.OutputStream)
            break;

          case DocumentContentsInfo.ContentResponseType.URL:
            var urlBuffer = new ByteArrayOutputStream()
            copyStream(docContent.InputStream, urlBuffer)
            resp.sendRedirect(urlBuffer.toString())
            break

          default:
            // Only DOCUMENT_CONTENTS or URL ResponseType is allowed for values returned
            // from IDocumentContentPlugin.getDocumentContentsInfoForExternalUse
            var msg = "Unexpected document content type: ${docContent.ResponseType}"
            LOGGER.logError("#doGet(HttpServletRequest,HttpServletResponse) - ${msg}")
            throw new ServletException(msg)
        }
      }finally {
        if ( docContent.InputStream != null ) {
          docContent.InputStream.close()
        }
      }
    } catch(e:JsonRpcInvalidRequestException) {
      resp.sendError(HttpServletResponse.SC_BAD_REQUEST)
    } catch(e:AuthorizationException) {
      LOGGER.logInfo(e.Message)
      resp.sendError(HttpServletResponse.SC_UNAUTHORIZED)
    } catch(e:JsonRpcSecurityException) {
      JsonRpcResponder.setErrorResponse(resp, e, "1")
    } catch(e:JsonRpcInvalidParamsException) {
      JsonRpcResponder.setErrorResponse(resp, e, "1")
    }
  }

  /**
   * Retrieves the document ID for the current servlet request.
   * Throws JsonRpcInvalidParamsException
   */
  @Param("req", "Document request received")
  @Throws(JsonRpcInvalidRequestException,"If the request is not a valid document request")
  private function retrieveDocumentID(req:HttpServletRequest) : String {
    var params = req.PathInfo.split("/")

    var docId = params.HasElements ? params.last() : null
    if ( params.length < 2 || !docId.HasContent ) {
      throw new IllegalArgumentException("Invalid document request received: ${req.PathInfo}")
    }
    return docId
  }

  /**
   * Copies the input stream to the output stream using a temporary buffer
   */
  @Param("is", "The source stream")
  @Param("os", "The destination stream")
  private function copyStream(is:InputStream, os:OutputStream)     {
    var buffer = new byte[TRANSFER_BUFFER_SIZE]
    var cnt = 0
    do {
      cnt = is.read(buffer)
      if (cnt > 0) {
        os.write(buffer, 0, cnt)
      }
    } while( cnt > 0 )
    os.flush()
  }
}