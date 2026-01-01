package edge.servlet.jsonrpc

uses edge.PlatformSupport.Logger
uses edge.PlatformSupport.Reflection
uses edge.security.EffectiveUser
uses javax.servlet.http.HttpServletRequest
uses javax.servlet.http.HttpServletResponse
uses edge.servlet.jsonrpc.protocol.JsonRpcResponder
uses edge.servlet.jsonrpc.protocol.JsonRpcResponse
uses edge.jsonrpc.exception.JsonRpcException
uses org.apache.commons.fileupload.DefaultFileItemFactory
uses org.apache.commons.fileupload.DiskFileUpload
uses org.apache.commons.fileupload.FileItem
uses java.io.IOException
uses edge.servlet.jsonrpc.marshalling.deserialization.dom.DomReader
uses java.io.StringReader
uses java.util.Arrays
uses edge.jsonrpc.endpoint.IEndpointMethod
uses edge.servlet.jsonrpc.marshalling.deserialization.Deserializer
uses gw.lang.reflect.IPropertyAccessor
uses edge.servlet.jsonrpc.marshalling.deserialization.DeserializerFactory
uses edge.metadata.service.DefaultMetadataService

/**
 * Processor for the multipart Json-Rpc requests.
 */
internal final class MultipartJsonRpcCallProcessor implements IRequestProcessor {


  final private static var LOGGER = new Logger(Reflection.getRelativeName(MultipartJsonRpcCallProcessor))

  /** Endpoint for the RPC to call. */
  private var peer : IEndpointMethod

  /** Parser for the first method argument. */
  private var firstArgParser : Deserializer

  /** Accessor for the content type on the first argument. */
  private var contentTypeAccessor : IPropertyAccessor

  construct(p : IEndpointMethod) {
    this.peer = p
    final var firstArgType = p.getArgumentTypes().get(0)
    this.contentTypeAccessor = DefaultMetadataService.SERVICE.getExposedProperties(firstArgType)
        .firstWhere( \ elt -> elt.Name == 'MimeType')?.Accessor
    this.firstArgParser = DeserializerFactory.INSTANCE.getDeserializer(firstArgType)
  }

  override function process(user : EffectiveUser, req : HttpServletRequest, resp :  HttpServletResponse) {
    final var params = parseMethodArgs(req)

    try{
      final var result = peer.call(user, Arrays.asList(params))
      JsonRpcResponder.setSuccessfulResponse(resp, new JsonRpcResponse(result, "1.0"))
    } catch(e : JsonRpcException) {
      LOGGER.logError(e)
      JsonRpcResponder.setErrorResponse(resp, e, "1.0")
    }
  }

  private function parseMethodArgs(req : HttpServletRequest) : Object[] {
    // Multipart content detected, parsing first part as the JSON payload
    final var defaultFileItemFactory = new DefaultFileItemFactory()
    final var diskFileUpload = new DiskFileUpload(defaultFileItemFactory)
    final var files = diskFileUpload.parseRequest(req) as List<FileItem>

    if (files.Count < 2) {
      throw new IOException("Do not know what to do with the single multipart file")
    }

    final var file = files.get(1)

    final var metaString = files.get(0).getString("UTF-8")
    final var metadataJson = DomReader.read(new StringReader(metaString))
    final var metadata = firstArgParser.deserialize(metadataJson)
    if (contentTypeAccessor != null && contentTypeAccessor.getValue(metadata) == null) {
      contentTypeAccessor.setValue(metadata, file.ContentType)
    }

    return { metadata, file }
  }
}
